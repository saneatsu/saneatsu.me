/**
 * 既存コンテンツにスペイン語（es）翻訳をバックフィルするスクリプト。
 *
 * @description
 * サイトに es を追加したが、既存の記事・ギャラリー画像・タグには es 翻訳が無い。
 * `get-article` ハンドラは `language = lang` を厳密一致で引くため、es 行が無い記事は
 * `/es/blog/[slug]` で 404 になる。このスクリプトは既存の日本語（ja）コンテンツを走査し、
 * 欠けている es 翻訳を Gemini で生成して埋める。
 *
 * 対象:
 * - 記事: status = "published" のみ（既存の en 自動翻訳の挙動に合わせる）
 * - ギャラリー画像: ja 翻訳を持つ全件
 * - タグ: ja 翻訳を持つ全件（表示ラベル用途のため自然なスペイン語を生成する）
 *
 * 冪等性:
 * - 記事・ギャラリーは (id, language) のユニーク制約があるため onConflictDoUpdate で再実行安全。
 * - タグは (tagId, language) のユニーク制約が無いため、事前に既存 es を除外してから挿入する。
 *
 * 実行:
 * - `pnpm --filter @saneatsu/backend db:backfill-es`
 * - `... db:backfill-es -- --dry-run`   書き込まず対象件数のみ表示（本番前の確認用）
 * - `... db:backfill-es -- --limit 3`    各種の先頭3件だけ処理（動作確認用）
 *
 * 環境変数（apps/backend/.env またはシェルの環境変数）:
 * - GEMINI_API_KEY       翻訳に使用
 * - TURSO_DATABASE_URL   ローカルは file:./local.db、本番は libsql://...
 * - TURSO_AUTH_TOKEN     本番 Turso のみ必要
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
	articles,
	articleTranslations,
	createDatabaseClient,
	galleryImages,
	galleryImageTranslations,
	tags,
	tagTranslations,
} from "@saneatsu/db";
import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";

import { translateWithGemini } from "../lib/translate";
import { createTranslationService } from "../services/gemini-translation/gemini-translation";

// ---------------------------------------------------------------------------
// 型・ユーティリティ
// ---------------------------------------------------------------------------

/** createDatabaseClient が返す Drizzle クライアントの型 */
type Db = ReturnType<typeof createDatabaseClient>;

/** バックフィルの実行オプション */
type BackfillOptions = {
	/** true の場合は書き込まず、対象件数と ID のみ出力する */
	dryRun: boolean;
	/** 各種の処理件数上限（未指定なら全件） */
	limit?: number;
};

/** 1種別ぶんの処理結果サマリー */
type BackfillSummary = {
	/** es が欠けていた（＝対象となった）件数 */
	target: number;
	/** 実際に翻訳・保存できた件数 */
	done: number;
	/** 翻訳失敗などでスキップした件数 */
	skipped: number;
};

/**
 * es が欠けているソース行だけを抽出する純粋関数
 *
 * @description
 * ja 翻訳を持つソース行のうち、既に es 翻訳を持つ ID を除外する。
 * DB アクセスを含まないため単体テストしやすい。
 *
 * @param sources - ja 翻訳を持つソース行の配列
 * @param existingEsIds - 既に es 翻訳を持つ ID の配列
 * @param getId - ソース行から対象 ID を取り出す関数
 * @returns es 翻訳がまだ無いソース行のみの配列
 */
export function pickMissing<T>(
	sources: T[],
	existingEsIds: number[],
	getId: (source: T) => number
): T[] {
	const existing = new Set(existingEsIds);
	return sources.filter((source) => !existing.has(getId(source)));
}

/** 指定ミリ秒だけ待機する（Gemini のレート制限対策） */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Gemini 呼び出し間の待機時間（ミリ秒）。translateBatch の実装に倣う。 */
const RATE_LIMIT_DELAY_MS = 1000;

/** limit オプションを適用して先頭 n 件に絞る */
function applyLimit<T>(items: T[], limit?: number): T[] {
	return typeof limit === "number" ? items.slice(0, limit) : items;
}

// ---------------------------------------------------------------------------
// 記事（published のみ）
// ---------------------------------------------------------------------------

/**
 * 公開記事の es 翻訳をバックフィルする
 *
 * 処理フロー:
 * 1. published 記事の ja タイトル・本文を取得
 * 2. 既に es 翻訳を持つ記事 ID を取得し、欠けているものだけに絞る
 * 3. dry-run ならログのみ返す
 * 4. 各記事を Gemini で es に翻訳（失敗時は null なのでスキップ）
 * 5. (articleId, language) をキーに upsert（冪等）
 */
async function backfillArticles(
	db: Db,
	apiKey: string,
	options: BackfillOptions
): Promise<BackfillSummary> {
	// 1. published 記事の ja 本文を取得
	const jaRows = await db
		.select({
			articleId: articles.id,
			title: articleTranslations.title,
			content: articleTranslations.content,
		})
		.from(articles)
		.innerJoin(
			articleTranslations,
			and(
				eq(articleTranslations.articleId, articles.id),
				eq(articleTranslations.language, "ja")
			)
		)
		.where(eq(articles.status, "published"));

	// 2. 既存 es を除外
	const existingEs = await db
		.select({ articleId: articleTranslations.articleId })
		.from(articleTranslations)
		.where(eq(articleTranslations.language, "es"));
	const missing = applyLimit(
		pickMissing(
			jaRows,
			existingEs.map((row) => row.articleId),
			(row) => row.articleId
		),
		options.limit
	);

	console.log(
		`📝 記事: es 未生成 ${missing.length} 件 / published ${jaRows.length} 件`
	);

	// 3. dry-run
	if (options.dryRun) {
		for (const row of missing) {
			console.log(`   [dry-run] articleId=${row.articleId} "${row.title}"`);
		}
		return { target: missing.length, done: 0, skipped: 0 };
	}

	// 4-5. 翻訳して upsert
	const translationService = createTranslationService({
		GEMINI_API_KEY: apiKey,
	});
	let done = 0;
	let skipped = 0;

	for (const row of missing) {
		const translated = await translationService.translateArticle(
			row.title,
			row.content,
			"es"
		);

		if (!translated) {
			console.warn(`   ⏭️  articleId=${row.articleId} 翻訳失敗のためスキップ`);
			skipped += 1;
			await sleep(RATE_LIMIT_DELAY_MS);
			continue;
		}

		await db
			.insert(articleTranslations)
			.values({
				articleId: row.articleId,
				language: "es",
				title: translated.title,
				content: translated.content,
			})
			.onConflictDoUpdate({
				target: [articleTranslations.articleId, articleTranslations.language],
				set: { title: translated.title, content: translated.content },
			});

		console.log(`   ✅ articleId=${row.articleId} "${translated.title}"`);
		done += 1;
		await sleep(RATE_LIMIT_DELAY_MS);
	}

	return { target: missing.length, done, skipped };
}

// ---------------------------------------------------------------------------
// ギャラリー画像（全件）
// ---------------------------------------------------------------------------

/**
 * ギャラリー画像の es 翻訳をバックフィルする
 *
 * 処理フロー:
 * 1. ja 翻訳を持つ画像のタイトル・説明を取得
 * 2. 既存 es を除外
 * 3. dry-run ならログのみ返す
 * 4. タイトル・説明を Gemini で es に翻訳（translateWithGemini は失敗時 throw → try/catch）
 * 5. (galleryImageId, language) をキーに upsert（冪等）
 */
async function backfillGalleryImages(
	db: Db,
	apiKey: string,
	options: BackfillOptions
): Promise<BackfillSummary> {
	// 1. ja 翻訳を取得
	const jaRows = await db
		.select({
			galleryImageId: galleryImages.id,
			title: galleryImageTranslations.title,
			description: galleryImageTranslations.description,
		})
		.from(galleryImages)
		.innerJoin(
			galleryImageTranslations,
			and(
				eq(galleryImageTranslations.galleryImageId, galleryImages.id),
				eq(galleryImageTranslations.language, "ja")
			)
		);

	// 2. 既存 es を除外
	const existingEs = await db
		.select({ galleryImageId: galleryImageTranslations.galleryImageId })
		.from(galleryImageTranslations)
		.where(eq(galleryImageTranslations.language, "es"));
	const missing = applyLimit(
		pickMissing(
			jaRows,
			existingEs.map((row) => row.galleryImageId),
			(row) => row.galleryImageId
		),
		options.limit
	);

	console.log(
		`🖼️  ギャラリー: es 未生成 ${missing.length} 件 / ja あり ${jaRows.length} 件`
	);

	// 3. dry-run
	if (options.dryRun) {
		for (const row of missing) {
			console.log(
				`   [dry-run] galleryImageId=${row.galleryImageId} "${row.title ?? ""}"`
			);
		}
		return { target: missing.length, done: 0, skipped: 0 };
	}

	// 4-5. 翻訳して upsert
	let done = 0;
	let skipped = 0;

	for (const row of missing) {
		try {
			// title / description は nullable。元が空なら翻訳せず null のままにする。
			const titleEs = row.title
				? await translateWithGemini(row.title, apiKey, "es")
				: null;
			const descriptionEs = row.description
				? await translateWithGemini(row.description, apiKey, "es")
				: null;

			const now = new Date().toISOString();
			await db
				.insert(galleryImageTranslations)
				.values({
					galleryImageId: row.galleryImageId,
					language: "es",
					title: titleEs,
					description: descriptionEs,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: [
						galleryImageTranslations.galleryImageId,
						galleryImageTranslations.language,
					],
					set: { title: titleEs, description: descriptionEs, updatedAt: now },
				});

			console.log(
				`   ✅ galleryImageId=${row.galleryImageId} "${titleEs ?? ""}"`
			);
			done += 1;
		} catch (error) {
			console.warn(
				`   ⏭️  galleryImageId=${row.galleryImageId} 翻訳失敗のためスキップ:`,
				error instanceof Error ? error.message : error
			);
			skipped += 1;
		}
		await sleep(RATE_LIMIT_DELAY_MS);
	}

	return { target: missing.length, done, skipped };
}

// ---------------------------------------------------------------------------
// タグ（全件）
// ---------------------------------------------------------------------------

/**
 * タグの es 翻訳をバックフィルする
 *
 * @remarks
 * - tag_translations には (tagId, language) のユニーク制約が無いため upsert が使えない。
 *   事前に既存 es の tagId を除外してから plain insert する。
 * - 既存の translateTag は英語スラッグ生成専用プロンプトで表示ラベルに不適なため、
 *   自然なスペイン語を得る translateWithGemini(..., "es") を使う。
 *
 * 処理フロー:
 * 1. ja 翻訳を持つタグ名を取得
 * 2. 既存 es を除外
 * 3. dry-run ならログのみ返す
 * 4. タグ名を Gemini で es に翻訳（失敗時 throw → try/catch）
 * 5. es 行を挿入
 */
async function backfillTags(
	db: Db,
	apiKey: string,
	options: BackfillOptions
): Promise<BackfillSummary> {
	// 1. ja 翻訳を取得
	const jaRows = await db
		.select({
			tagId: tags.id,
			name: tagTranslations.name,
		})
		.from(tags)
		.innerJoin(
			tagTranslations,
			and(
				eq(tagTranslations.tagId, tags.id),
				eq(tagTranslations.language, "ja")
			)
		);

	// 2. 既存 es を除外
	const existingEs = await db
		.select({ tagId: tagTranslations.tagId })
		.from(tagTranslations)
		.where(eq(tagTranslations.language, "es"));
	const missing = applyLimit(
		pickMissing(
			jaRows,
			existingEs.map((row) => row.tagId),
			(row) => row.tagId
		),
		options.limit
	);

	console.log(
		`🏷️  タグ: es 未生成 ${missing.length} 件 / ja あり ${jaRows.length} 件`
	);

	// 3. dry-run
	if (options.dryRun) {
		for (const row of missing) {
			console.log(`   [dry-run] tagId=${row.tagId} "${row.name}"`);
		}
		return { target: missing.length, done: 0, skipped: 0 };
	}

	// 4-5. 翻訳して挿入
	let done = 0;
	let skipped = 0;

	for (const row of missing) {
		try {
			const nameEs = await translateWithGemini(row.name, apiKey, "es");
			await db.insert(tagTranslations).values({
				tagId: row.tagId,
				language: "es",
				name: nameEs,
			});
			console.log(`   ✅ tagId=${row.tagId} "${row.name}" -> "${nameEs}"`);
			done += 1;
		} catch (error) {
			console.warn(
				`   ⏭️  tagId=${row.tagId} 翻訳失敗のためスキップ:`,
				error instanceof Error ? error.message : error
			);
			skipped += 1;
		}
		await sleep(RATE_LIMIT_DELAY_MS);
	}

	return { target: missing.length, done, skipped };
}

// ---------------------------------------------------------------------------
// エントリーポイント
// ---------------------------------------------------------------------------

/** コマンドライン引数を解釈する */
function parseArgs(argv: string[]): BackfillOptions {
	const dryRun = argv.includes("--dry-run");
	const limitIndex = argv.indexOf("--limit");
	const limit =
		limitIndex !== -1
			? Number.parseInt(argv[limitIndex + 1] ?? "", 10)
			: undefined;
	return {
		dryRun,
		limit: Number.isNaN(limit) ? undefined : limit,
	};
}

async function main() {
	// 環境変数をロード（apps/backend/.env）。本番 Turso はシェルの環境変数を優先。
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	dotenv.config({ path: path.resolve(__dirname, "../../.env") });

	const apiKey = process.env.GEMINI_API_KEY;
	const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
	const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

	if (!apiKey) {
		console.error(
			"❌ GEMINI_API_KEY が未設定です。apps/backend/.env に設定するか、環境変数で渡してください。"
		);
		process.exit(1);
	}

	const options = parseArgs(process.argv.slice(2));
	if (options.dryRun) {
		console.log("🔍 dry-run モード: 書き込みは行いません");
	}
	if (options.limit !== undefined) {
		console.log(`🔢 limit: 各種 ${options.limit} 件まで`);
	}
	console.log(`🗄️  DB: ${databaseUrl}`);

	const db = createDatabaseClient({
		TURSO_DATABASE_URL: databaseUrl,
		TURSO_AUTH_TOKEN: authToken,
	});

	const articleSummary = await backfillArticles(db, apiKey, options);
	const gallerySummary = await backfillGalleryImages(db, apiKey, options);
	const tagSummary = await backfillTags(db, apiKey, options);

	console.log("\n✅ バックフィル完了");
	console.log(
		`   記事:       対象 ${articleSummary.target} / 完了 ${articleSummary.done} / スキップ ${articleSummary.skipped}`
	);
	console.log(
		`   ギャラリー: 対象 ${gallerySummary.target} / 完了 ${gallerySummary.done} / スキップ ${gallerySummary.skipped}`
	);
	console.log(
		`   タグ:       対象 ${tagSummary.target} / 完了 ${tagSummary.done} / スキップ ${tagSummary.skipped}`
	);

	process.exit(0);
}

// このファイルを直接 tsx で実行したときだけ main を起動する。
// テストから pickMissing を import しても main が走らないようにするため。
const isDirectRun =
	process.argv[1] !== undefined &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
	main().catch((error) => {
		console.error("❌ バックフィルに失敗しました", error);
		process.exit(1);
	});
}
