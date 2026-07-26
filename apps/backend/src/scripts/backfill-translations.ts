/**
 * 既存コンテンツの多言語翻訳をバックフィルするスクリプト。
 *
 * ============================================================================
 * これは何をするもの？
 * ============================================================================
 * 記事・ギャラリー画像・タグは、新規作成/更新時にのみ日本語(ja)から他言語へ
 * 自動翻訳される。そのため「後から対応言語を増やした」場合、既存コンテンツには
 * その言語の翻訳が無い状態になる。
 * 例: es を追加した直後は、既存記事に es 行が無いため /es/blog/[slug] が 404 になる。
 *
 * このスクリプトは既存の ja コンテンツを走査し、指定した言語（または全対応言語）の
 * 「まだ翻訳が無い」ぶんだけを Gemini で生成して DB に埋める。
 *
 * 対象:
 * - 記事: status = "published" のみ（新規作成時の自動翻訳が published 限定なのに合わせる）
 * - ギャラリー画像: ja 翻訳を持つ全件
 * - タグ: ja 翻訳を持つ全件（表示ラベル用途のため自然な訳語を生成する）
 *
 * 翻訳先の言語は TARGET_LANGUAGES（gemini-translation.ts）を単一ソースとする。
 * 言語を1つ増やす手順は TARGET_LANGUAGES の定義コメントを参照。
 *
 * ============================================================================
 * 使い方
 * ============================================================================
 *   # 全対応言語（TARGET_LANGUAGES）を対象に、書き込まず件数だけ確認
 *   pnpm --filter @saneatsu/backend db:backfill -- --dry-run
 *
 *   # 特定言語だけを対象にする（例: 韓国語）。--dry-run と併用可
 *   pnpm --filter @saneatsu/backend db:backfill -- --target ko --dry-run
 *
 *   # 動作確認用に各種の先頭 N 件だけ処理
 *   pnpm --filter @saneatsu/backend db:backfill -- --target es --limit 3
 *
 *   # 本実行（フラグ無し = 全対応言語 × 全対象を翻訳・書き込み）
 *   pnpm --filter @saneatsu/backend db:backfill
 *
 * 冪等性:
 * - 記事・ギャラリーは (id, language) のユニーク制約があるため onConflictDoUpdate で再実行安全。
 * - タグは (tagId, language) のユニーク制約が無いため、事前に既存訳を除外してから挿入する。
 * - 途中で失敗しても再実行すれば「まだ無いぶん」だけ続きから埋まる。
 *
 * 環境変数（apps/backend/.env またはシェルの環境変数）:
 * - GEMINI_API_KEY       翻訳に使用
 * - TURSO_DATABASE_URL   ローカルは file:./local.db、本番は libsql://...
 * - TURSO_AUTH_TOKEN     本番 Turso のみ必要
 * ============================================================================
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
import {
	createTranslationService,
	type GeminiTranslationService,
	TARGET_LANGUAGES,
	type TargetLanguage,
} from "../services/gemini-translation/gemini-translation";

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
	/** 翻訳が欠けていた（＝対象となった）件数 */
	target: number;
	/** 実際に翻訳・保存できた件数 */
	done: number;
	/** 翻訳失敗などでスキップした件数 */
	skipped: number;
};

/**
 * 指定言語の翻訳が欠けているソース行だけを抽出する純粋関数
 *
 * @description
 * ja 翻訳を持つソース行のうち、既に対象言語の翻訳を持つ ID を除外する。
 * DB アクセスを含まないため単体テストしやすい。
 *
 * @param sources - ja 翻訳を持つソース行の配列
 * @param existingTargetIds - 既に対象言語の翻訳を持つ ID の配列
 * @param getId - ソース行から対象 ID を取り出す関数
 * @returns 対象言語の翻訳がまだ無いソース行のみの配列
 */
export function pickMissing<T>(
	sources: T[],
	existingTargetIds: number[],
	getId: (source: T) => number
): T[] {
	const existing = new Set(existingTargetIds);
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
 * 公開記事の翻訳を指定言語にバックフィルする
 *
 * 処理フロー:
 * 1. published 記事の ja タイトル・本文を取得
 * 2. 既に対象言語の翻訳を持つ記事 ID を取得し、欠けているものだけに絞る
 * 3. dry-run ならログのみ返す
 * 4. 各記事を Gemini で対象言語に翻訳（失敗時は null なのでスキップ）
 * 5. (articleId, language) をキーに upsert（冪等）
 */
async function backfillArticles(
	db: Db,
	translationService: GeminiTranslationService,
	target: TargetLanguage,
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

	// 2. 既存の対象言語を除外
	const existing = await db
		.select({ articleId: articleTranslations.articleId })
		.from(articleTranslations)
		.where(eq(articleTranslations.language, target));
	const missing = applyLimit(
		pickMissing(
			jaRows,
			existing.map((row) => row.articleId),
			(row) => row.articleId
		),
		options.limit
	);

	console.log(
		`📝 記事[${target}]: 未生成 ${missing.length} 件 / published ${jaRows.length} 件`
	);

	// 3. dry-run
	if (options.dryRun) {
		for (const row of missing) {
			console.log(`   [dry-run] articleId=${row.articleId} "${row.title}"`);
		}
		return { target: missing.length, done: 0, skipped: 0 };
	}

	// 4-5. 翻訳して upsert
	let done = 0;
	let skipped = 0;

	for (const row of missing) {
		const translated = await translationService.translateArticle(
			row.title,
			row.content,
			target
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
				language: target,
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
 * ギャラリー画像の翻訳を指定言語にバックフィルする
 *
 * 処理フロー:
 * 1. ja 翻訳を持つ画像のタイトル・説明を取得
 * 2. 既存の対象言語を除外
 * 3. dry-run ならログのみ返す
 * 4. タイトル・説明を Gemini で対象言語に翻訳（translateWithGemini は失敗時 throw → try/catch）
 * 5. (galleryImageId, language) をキーに upsert（冪等）
 */
async function backfillGalleryImages(
	db: Db,
	apiKey: string,
	target: TargetLanguage,
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

	// 2. 既存の対象言語を除外
	const existing = await db
		.select({ galleryImageId: galleryImageTranslations.galleryImageId })
		.from(galleryImageTranslations)
		.where(eq(galleryImageTranslations.language, target));
	const missing = applyLimit(
		pickMissing(
			jaRows,
			existing.map((row) => row.galleryImageId),
			(row) => row.galleryImageId
		),
		options.limit
	);

	console.log(
		`🖼️  ギャラリー[${target}]: 未生成 ${missing.length} 件 / ja あり ${jaRows.length} 件`
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
			const titleTranslated = row.title
				? await translateWithGemini(row.title, apiKey, target)
				: null;
			const descriptionTranslated = row.description
				? await translateWithGemini(row.description, apiKey, target)
				: null;

			const now = new Date().toISOString();
			await db
				.insert(galleryImageTranslations)
				.values({
					galleryImageId: row.galleryImageId,
					language: target,
					title: titleTranslated,
					description: descriptionTranslated,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: [
						galleryImageTranslations.galleryImageId,
						galleryImageTranslations.language,
					],
					set: {
						title: titleTranslated,
						description: descriptionTranslated,
						updatedAt: now,
					},
				});

			console.log(
				`   ✅ galleryImageId=${row.galleryImageId} "${titleTranslated ?? ""}"`
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
 * タグの翻訳を指定言語にバックフィルする
 *
 * @remarks
 * - tag_translations には (tagId, language) のユニーク制約が無いため upsert が使えない。
 *   事前に既存の対象言語 tagId を除外してから plain insert する。
 * - 既存の translateTag は英語スラッグ生成専用プロンプトで表示ラベルに不適なため、
 *   自然な訳語を得る translateWithGemini(..., target) を使う。
 *
 * 処理フロー:
 * 1. ja 翻訳を持つタグ名を取得
 * 2. 既存の対象言語を除外
 * 3. dry-run ならログのみ返す
 * 4. タグ名を Gemini で対象言語に翻訳（失敗時 throw → try/catch）
 * 5. 翻訳行を挿入
 */
async function backfillTags(
	db: Db,
	apiKey: string,
	target: TargetLanguage,
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

	// 2. 既存の対象言語を除外
	const existing = await db
		.select({ tagId: tagTranslations.tagId })
		.from(tagTranslations)
		.where(eq(tagTranslations.language, target));
	const missing = applyLimit(
		pickMissing(
			jaRows,
			existing.map((row) => row.tagId),
			(row) => row.tagId
		),
		options.limit
	);

	console.log(
		`🏷️  タグ[${target}]: 未生成 ${missing.length} 件 / ja あり ${jaRows.length} 件`
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
			const nameTranslated = await translateWithGemini(
				row.name,
				apiKey,
				target
			);
			await db.insert(tagTranslations).values({
				tagId: row.tagId,
				language: target,
				name: nameTranslated,
			});
			console.log(
				`   ✅ tagId=${row.tagId} "${row.name}" -> "${nameTranslated}"`
			);
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

/** パース済みのコマンドライン引数 */
type ParsedArgs = BackfillOptions & {
	/** 翻訳先の言語（未指定なら全 TARGET_LANGUAGES を対象にする） */
	targets: readonly TargetLanguage[];
};

/**
 * コマンドライン引数を解釈する
 *
 * @throws --target に TARGET_LANGUAGES 外の値が渡された場合
 */
function parseArgs(argv: string[]): ParsedArgs {
	const dryRun = argv.includes("--dry-run");

	const limitIndex = argv.indexOf("--limit");
	const limitRaw =
		limitIndex !== -1
			? Number.parseInt(argv[limitIndex + 1] ?? "", 10)
			: Number.NaN;
	const limit = Number.isNaN(limitRaw) ? undefined : limitRaw;

	// --target を指定した場合はその言語のみ。未指定なら全対応言語。
	const targetIndex = argv.indexOf("--target");
	if (targetIndex === -1) {
		return { dryRun, limit, targets: TARGET_LANGUAGES };
	}

	const requested = argv[targetIndex + 1];
	if (!requested || !TARGET_LANGUAGES.includes(requested as TargetLanguage)) {
		throw new Error(
			`--target には次のいずれかを指定してください: ${TARGET_LANGUAGES.join(", ")}（指定値: ${requested ?? "なし"}）`
		);
	}
	return { dryRun, limit, targets: [requested as TargetLanguage] };
}

async function main() {
	// 環境変数をロード（apps/backend/.env）。本番 Turso はシェルの環境変数を優先。
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	dotenv.config({ path: path.resolve(currentDir, "../../.env") });

	const apiKey = process.env.GEMINI_API_KEY;
	const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
	const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

	if (!apiKey) {
		console.error(
			"❌ GEMINI_API_KEY が未設定です。apps/backend/.env に設定するか、環境変数で渡してください。"
		);
		process.exit(1);
	}

	let args: ParsedArgs;
	try {
		args = parseArgs(process.argv.slice(2));
	} catch (error) {
		console.error(`❌ ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	}
	const options: BackfillOptions = { dryRun: args.dryRun, limit: args.limit };

	if (options.dryRun) {
		console.log("🔍 dry-run モード: 書き込みは行いません");
	}
	if (options.limit !== undefined) {
		console.log(`🔢 limit: 各種 ${options.limit} 件まで`);
	}
	console.log(`🌐 対象言語: ${args.targets.join(", ")}`);
	console.log(`🗄️  DB: ${databaseUrl}`);

	const db = createDatabaseClient({
		TURSO_DATABASE_URL: databaseUrl,
		TURSO_AUTH_TOKEN: authToken,
	});
	const translationService = createTranslationService({
		GEMINI_API_KEY: apiKey,
	});

	// 対象言語ごとに、記事 → ギャラリー → タグ の順でバックフィルする
	for (const target of args.targets) {
		console.log(`\n──────── ${target} ────────`);
		const articleSummary = await backfillArticles(
			db,
			translationService,
			target,
			options
		);
		const gallerySummary = await backfillGalleryImages(
			db,
			apiKey,
			target,
			options
		);
		const tagSummary = await backfillTags(db, apiKey, target, options);

		console.log(
			`   小計[${target}] 記事 ${articleSummary.done}/${articleSummary.target}, ` +
				`ギャラリー ${gallerySummary.done}/${gallerySummary.target}, ` +
				`タグ ${tagSummary.done}/${tagSummary.target}（完了/対象）`
		);
	}

	console.log("\n✅ バックフィル完了");
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
