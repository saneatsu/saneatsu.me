/**
 * データベースのシードデータ生成スクリプト（200件記事版）
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { toJstDateKey } from "./lib/contributions/contribution-aggregator";
import * as schema from "./schema";
import {
	articleGalleryImages,
	articles,
	articleTags,
	articleTranslations,
	dailyArticleContributions,
	dailyArticleViews,
	galleryImages,
	galleryImageTranslations,
	tags,
	tagTranslations,
	users,
} from "./schema";
import { ARTICLE_CONTENT_TEMPLATES } from "./seed-data/article-content-templates";

// シード用のデータベース接続（ローカルSQLite）
const client = createClient({
	url: "file:./local.db",
});

const db = drizzle(client, { schema });

/**
 * すべてのテーブルをクリアする
 */
async function clearAllTables() {
	console.log("🗑️  すべてのテーブルをクリア中...");

	try {
		// 外部キー制約を考慮して削除順序を設定
		await db.delete(galleryImageTranslations);
		await db.delete(articleGalleryImages); // 記事とギャラリー画像の紐付け（外部キーあり）
		await db.delete(galleryImages);
		await db.delete(articleTags);
		await db.delete(tagTranslations);
		await db.delete(tags);
		await db.delete(articleTranslations);
		await db.delete(dailyArticleContributions);
		await db.delete(dailyArticleViews);
		await db.delete(articles);
		await db.delete(users);

		console.log("✅ すべてのテーブルをクリアしました");
	} catch (error) {
		console.error("❌ テーブルクリア中にエラーが発生しました:", error);
		throw error;
	}
}

/**
 * ギャラリー画像用の都市データ
 * 各都市の中心座標と件数を定義
 */
const GALLERY_CITIES = [
	// 東京 (20件)
	{ name: "tokyo", lat: 35.6762, lon: 139.6503, count: 20 },
	// 大阪 (2件)
	{ name: "osaka", lat: 34.6937, lon: 135.5023, count: 2 },
	// 福岡 (2件)
	{ name: "fukuoka", lat: 33.5904, lon: 130.4017, count: 2 },
	// 名古屋 (2件)
	{ name: "nagoya", lat: 35.1815, lon: 136.9066, count: 2 },
	// 札幌 (2件)
	{ name: "sapporo", lat: 43.0642, lon: 141.3469, count: 2 },
	// 千葉 (2件)
	{ name: "chiba", lat: 35.6074, lon: 140.1065, count: 2 },
	// アメリカ (2件)
	{ name: "usa", lat: 40.7128, lon: -74.006, count: 2 },
	// イギリス (2件)
	{ name: "uk", lat: 51.5074, lon: -0.1278, count: 2 },
	// カナダ (2件)
	{ name: "canada", lat: 43.6532, lon: -79.3832, count: 2 },
	// オーストラリア (2件)
	{ name: "australia", lat: -33.8688, lon: 151.2093, count: 2 },
	// インド (2件)
	{ name: "india", lat: 28.6139, lon: 77.209, count: 2 },
	// タイ (2件)
	{ name: "thailand", lat: 13.7563, lon: 100.5018, count: 2 },
	// 中国 (2件)
	{ name: "china", lat: 39.9042, lon: 116.4074, count: 2 },
	// エジプト (2件)
	{ name: "egypt", lat: 30.0444, lon: 31.2357, count: 2 },
	// ロシア (2件)
	{ name: "russia", lat: 55.7558, lon: 37.6173, count: 2 },
	// ブラジル (2件)
	{ name: "brazil", lat: -23.5505, lon: -46.6333, count: 2 },
];

/**
 * 都市ごとの観光スポット・タイトルデータ
 */
const GALLERY_CONTENT: Record<
	string,
	Array<{ ja: string; en: string; descJa: string; descEn: string }>
> = {
	tokyo: [
		{
			ja: "東京タワーの夜景",
			en: "Tokyo Tower at Night",
			descJa: "東京のシンボル、東京タワーがライトアップされた美しい夜景",
			descEn: "The iconic Tokyo Tower illuminated beautifully at night",
		},
		{
			ja: "浅草寺と雷門",
			en: "Senso-ji Temple and Kaminarimon Gate",
			descJa: "東京最古の寺院、浅草寺の荘厳な雷門",
			descEn:
				"The majestic Kaminarimon Gate of Tokyo's oldest temple, Senso-ji",
		},
		{
			ja: "スカイツリーからの眺望",
			en: "View from Tokyo Skytree",
			descJa: "東京スカイツリー展望台からの息をのむような景色",
			descEn: "Breathtaking view from the Tokyo Skytree observation deck",
		},
		{
			ja: "渋谷スクランブル交差点",
			en: "Shibuya Scramble Crossing",
			descJa: "世界で最も有名な交差点の一つ、渋谷スクランブル交差点",
			descEn:
				"One of the world's most famous intersections, Shibuya Scramble Crossing",
		},
		{
			ja: "新宿御苑の桜",
			en: "Cherry Blossoms at Shinjuku Gyoen",
			descJa: "春の新宿御苑に咲き誇る美しい桜",
			descEn:
				"Beautiful cherry blossoms in full bloom at Shinjuku Gyoen in spring",
		},
		{
			ja: "明治神宮の鳥居",
			en: "Meiji Shrine Torii Gate",
			descJa: "都会の中の静寂な空間、明治神宮の荘厳な鳥居",
			descEn:
				"The majestic torii gate of Meiji Shrine, a serene space in the city",
		},
		{
			ja: "お台場レインボーブリッジ",
			en: "Odaiba Rainbow Bridge",
			descJa: "東京湾に架かる美しいレインボーブリッジの夜景",
			descEn: "Beautiful night view of Rainbow Bridge spanning Tokyo Bay",
		},
		{
			ja: "上野動物園のパンダ",
			en: "Pandas at Ueno Zoo",
			descJa: "上野動物園の人気者、愛らしいパンダ",
			descEn: "Adorable pandas, the popular attractions at Ueno Zoo",
		},
		{
			ja: "築地市場の朝",
			en: "Morning at Tsukiji Market",
			descJa: "活気あふれる築地市場の早朝の風景",
			descEn: "Vibrant early morning scene at Tsukiji Market",
		},
		{
			ja: "六本木ヒルズからの夜景",
			en: "Night View from Roppongi Hills",
			descJa: "六本木ヒルズ展望台から見る東京の煌めく夜景",
			descEn: "Glittering Tokyo night view from Roppongi Hills observatory",
		},
		{
			ja: "皇居外苑の緑",
			en: "Greenery at Imperial Palace Outer Garden",
			descJa: "都心のオアシス、皇居外苑の美しい緑",
			descEn:
				"Beautiful greenery at the Imperial Palace Outer Garden, an oasis in the city center",
		},
		{
			ja: "秋葉原の電気街",
			en: "Electric Town in Akihabara",
			descJa: "日本のポップカルチャーの中心地、秋葉原",
			descEn: "Akihabara, the center of Japanese pop culture",
		},
		{
			ja: "東京駅丸の内駅舎",
			en: "Tokyo Station Marunouchi Building",
			descJa: "重要文化財に指定された美しい東京駅の赤レンガ駅舎",
			descEn:
				"The beautiful red brick station building of Tokyo Station, designated as an Important Cultural Property",
		},
		{
			ja: "表参道のイルミネーション",
			en: "Illumination at Omotesando",
			descJa: "冬の表参道を彩る幻想的なイルミネーション",
			descEn: "Fantastic illumination decorating Omotesando in winter",
		},
		{
			ja: "隅田川の桜並木",
			en: "Cherry Blossom Trees along Sumida River",
			descJa: "隅田川沿いに咲く満開の桜並木",
			descEn: "Cherry blossom trees in full bloom along the Sumida River",
		},
		{
			ja: "代々木公園の紅葉",
			en: "Autumn Leaves at Yoyogi Park",
			descJa: "秋の代々木公園を彩る美しい紅葉",
			descEn: "Beautiful autumn leaves coloring Yoyogi Park in fall",
		},
		{
			ja: "銀座の夜のショッピング街",
			en: "Ginza Shopping District at Night",
			descJa: "高級ブランド店が立ち並ぶ銀座の華やかな夜景",
			descEn: "Glamorous night view of Ginza lined with luxury brand stores",
		},
		{
			ja: "東京国立博物館",
			en: "Tokyo National Museum",
			descJa: "日本最古の博物館、東京国立博物館の本館",
			descEn:
				"The main building of Tokyo National Museum, Japan's oldest museum",
		},
		{
			ja: "竹下通りのストリート",
			en: "Takeshita Street",
			descJa: "原宿の若者文化の中心地、賑やかな竹下通り",
			descEn:
				"Bustling Takeshita Street, the center of youth culture in Harajuku",
		},
		{
			ja: "東京湾の夕焼け",
			en: "Sunset over Tokyo Bay",
			descJa: "東京湾に沈む美しい夕日",
			descEn: "Beautiful sunset over Tokyo Bay",
		},
	],
	osaka: [
		{
			ja: "大阪城の桜",
			en: "Osaka Castle with Cherry Blossoms",
			descJa: "春の大阪城を彩る満開の桜",
			descEn:
				"Osaka Castle adorned with cherry blossoms in full bloom in spring",
		},
		{
			ja: "道頓堀の夜景",
			en: "Dotonbori at Night",
			descJa: "大阪の繁華街、道頓堀の賑やかな夜の風景",
			descEn:
				"Bustling night scene of Dotonbori, Osaka's entertainment district",
		},
	],
	fukuoka: [
		{
			ja: "福岡タワーの夜景",
			en: "Fukuoka Tower at Night",
			descJa: "海辺に佇む福岡タワーの美しいライトアップ",
			descEn: "Beautiful illumination of Fukuoka Tower standing by the sea",
		},
		{
			ja: "太宰府天満宮",
			en: "Dazaifu Tenmangu Shrine",
			descJa: "学問の神様を祀る太宰府天満宮の本殿",
			descEn:
				"Main hall of Dazaifu Tenmangu Shrine dedicated to the god of learning",
		},
	],
	nagoya: [
		{
			ja: "名古屋城の金のしゃちほこ",
			en: "Golden Shachihoko of Nagoya Castle",
			descJa: "名古屋のシンボル、名古屋城の金のしゃちほこ",
			descEn: "The golden shachihoko of Nagoya Castle, a symbol of Nagoya",
		},
		{
			ja: "熱田神宮の森",
			en: "Forest at Atsuta Shrine",
			descJa: "都会の中の静寂な空間、熱田神宮の鎮守の森",
			descEn: "Sacred forest of Atsuta Shrine, a serene space in the city",
		},
	],
	sapporo: [
		{
			ja: "札幌時計台",
			en: "Sapporo Clock Tower",
			descJa: "札幌のシンボル、歴史的建造物の時計台",
			descEn: "The Clock Tower, a symbol and historical building of Sapporo",
		},
		{
			ja: "大通公園の雪まつり",
			en: "Snow Festival at Odori Park",
			descJa: "冬の札幌を彩る雪まつりの氷像",
			descEn:
				"Ice sculptures of the Snow Festival decorating Sapporo in winter",
		},
	],
	chiba: [
		{
			ja: "東京ディズニーランド",
			en: "Tokyo Disneyland",
			descJa: "夢と魔法の王国、東京ディズニーランドのシンデレラ城",
			descEn:
				"Cinderella Castle at Tokyo Disneyland, the kingdom of dreams and magic",
		},
		{
			ja: "幕張メッセ",
			en: "Makuhari Messe",
			descJa: "国際会議やイベントが開催される幕張メッセ",
			descEn:
				"Makuhari Messe where international conferences and events are held",
		},
	],
	usa: [
		{
			ja: "自由の女神像",
			en: "Statue of Liberty",
			descJa: "ニューヨークのシンボル、自由の女神像",
			descEn: "The Statue of Liberty, a symbol of New York",
		},
		{
			ja: "タイムズスクエアの夜",
			en: "Times Square at Night",
			descJa: "眠らない街ニューヨーク、タイムズスクエアの夜景",
			descEn:
				"Night view of Times Square in New York, the city that never sleeps",
		},
	],
	uk: [
		{
			ja: "ビッグベンと国会議事堂",
			en: "Big Ben and Houses of Parliament",
			descJa: "ロンドンのランドマーク、ビッグベンと国会議事堂",
			descEn: "Big Ben and the Houses of Parliament, landmarks of London",
		},
		{
			ja: "タワーブリッジ",
			en: "Tower Bridge",
			descJa: "テムズ川に架かる美しいタワーブリッジ",
			descEn: "Beautiful Tower Bridge spanning the River Thames",
		},
	],
	canada: [
		{
			ja: "CNタワー",
			en: "CN Tower",
			descJa: "トロントのシンボル、CNタワーからの眺望",
			descEn: "View from CN Tower, a symbol of Toronto",
		},
		{
			ja: "ナイアガラの滝",
			en: "Niagara Falls",
			descJa: "壮大な自然の驚異、ナイアガラの滝",
			descEn: "Niagara Falls, a magnificent natural wonder",
		},
	],
	australia: [
		{
			ja: "シドニーオペラハウス",
			en: "Sydney Opera House",
			descJa: "世界遺産、シドニーオペラハウスの美しい外観",
			descEn: "Beautiful exterior of Sydney Opera House, a World Heritage Site",
		},
		{
			ja: "ハーバーブリッジ",
			en: "Sydney Harbour Bridge",
			descJa: "シドニー湾に架かる象徴的なハーバーブリッジ",
			descEn: "Iconic Harbour Bridge spanning Sydney Harbour",
		},
	],
	india: [
		{
			ja: "タージマハル",
			en: "Taj Mahal",
			descJa: "世界遺産、白亜の霊廟タージマハル",
			descEn: "The Taj Mahal, a white marble mausoleum and World Heritage Site",
		},
		{
			ja: "ガンジス川の朝",
			en: "Morning at Ganges River",
			descJa: "聖なる川ガンジスの神秘的な朝の風景",
			descEn: "Mystical morning scene at the sacred Ganges River",
		},
	],
	thailand: [
		{
			ja: "ワット・アルン（暁の寺）",
			en: "Wat Arun (Temple of Dawn)",
			descJa: "バンコクのシンボル、美しいワット・アルン",
			descEn: "Beautiful Wat Arun, a symbol of Bangkok",
		},
		{
			ja: "水上マーケット",
			en: "Floating Market",
			descJa: "タイの伝統的な水上マーケットの風景",
			descEn: "Traditional Thai floating market scene",
		},
	],
	china: [
		{
			ja: "万里の長城",
			en: "Great Wall of China",
			descJa: "世界遺産、雄大な万里の長城",
			descEn: "The magnificent Great Wall of China, a World Heritage Site",
		},
		{
			ja: "紫禁城",
			en: "Forbidden City",
			descJa: "北京の歴史的建造物、紫禁城",
			descEn: "The Forbidden City, a historical building in Beijing",
		},
	],
	egypt: [
		{
			ja: "ギザの大ピラミッド",
			en: "Great Pyramid of Giza",
			descJa: "古代エジプトの驚異、ギザの大ピラミッド",
			descEn: "The Great Pyramid of Giza, a wonder of ancient Egypt",
		},
		{
			ja: "スフィンクス",
			en: "Sphinx",
			descJa: "謎に包まれた古代遺跡、スフィンクス",
			descEn: "The mysterious ancient monument, the Sphinx",
		},
	],
	russia: [
		{
			ja: "赤の広場",
			en: "Red Square",
			descJa: "モスクワの中心、歴史的な赤の広場",
			descEn: "The historical Red Square in the center of Moscow",
		},
		{
			ja: "聖ワシリイ大聖堂",
			en: "Saint Basil's Cathedral",
			descJa: "色とりどりの玉ねぎ型ドームが美しい聖ワシリイ大聖堂",
			descEn: "Saint Basil's Cathedral with its beautiful colorful onion domes",
		},
	],
	brazil: [
		{
			ja: "コルコバードのキリスト像",
			en: "Christ the Redeemer",
			descJa: "リオデジャネイロのシンボル、コルコバードのキリスト像",
			descEn: "Christ the Redeemer, a symbol of Rio de Janeiro",
		},
		{
			ja: "コパカバーナビーチ",
			en: "Copacabana Beach",
			descJa: "リオデジャネイロの美しいコパカバーナビーチ",
			descEn: "Beautiful Copacabana Beach in Rio de Janeiro",
		},
	],
};

/**
 * ギャラリー画像のシードデータを生成
 *
 * @description
 * 1. 都市ごとの指定件数の画像データを生成（東京20件、その他各2件）
 * 2. 共通のCloudflare Images IDを使用
 * 3. 各都市の中心座標の近くにランダムな座標を生成（±0.1度）
 * 4. 過去365日以内のランダムなtakenAt日時を生成
 * 5. 日本語と英語の翻訳データを生成
 */
async function seedGalleryImages() {
	console.log("🖼️  ギャラリー画像を生成中...");

	const cfImageId =
		"saneatsu-me_development_content_7bb0eb42-4d0c-45ed-87b8-5b10ecf1ca3a";
	const now = new Date();
	const oneYearAgo = new Date(now);
	oneYearAgo.setFullYear(now.getFullYear() - 1);

	let totalImageCount = 0;

	// 1. 各都市ごとにループ
	for (const city of GALLERY_CITIES) {
		const cityContent = GALLERY_CONTENT[city.name];
		if (!cityContent || cityContent.length < city.count) {
			console.warn(
				`⚠️  ${city.name}のコンテンツが不足しています（必要: ${city.count}件、実際: ${cityContent?.length || 0}件）`
			);
			continue;
		}

		const galleryImageData = [];

		// 2. 各都市の指定件数分の画像データを生成
		for (let i = 0; i < city.count; i++) {
			// 2.1. 座標にランダムな変動を加える（±0.1度）
			const latVariation = (Math.random() - 0.5) * 0.2; // -0.1 ~ +0.1
			const lonVariation = (Math.random() - 0.5) * 0.2; // -0.1 ~ +0.1
			const latitude = city.lat + latVariation;
			const longitude = city.lon + lonVariation;

			// 2.2. 過去365日以内のランダムな日時を生成
			const randomTime =
				oneYearAgo.getTime() +
				Math.random() * (now.getTime() - oneYearAgo.getTime());
			const takenAt = new Date(randomTime).toISOString();

			// 2.3. ステータスをランダムに設定（60%が公開済み、40%が下書き）
			const status: "published" | "draft" =
				Math.random() < 0.6 ? "published" : "draft";

			galleryImageData.push({
				cfImageId,
				latitude,
				longitude,
				takenAt,
				status,
			});
		}

		// 3. gallery_imagesテーブルに挿入
		const insertedImages = await db
			.insert(galleryImages)
			.values(galleryImageData)
			.returning();

		totalImageCount += insertedImages.length;

		// 4. 翻訳データを生成
		const translationData = [];

		for (let i = 0; i < insertedImages.length; i++) {
			const image = insertedImages[i];
			const content = cityContent[i];

			// 4.1. 日本語の翻訳
			translationData.push({
				galleryImageId: image.id,
				title: content.ja,
				description: content.descJa,
				language: "ja" as const,
			});

			// 4.2. 英語の翻訳
			translationData.push({
				galleryImageId: image.id,
				title: content.en,
				description: content.descEn,
				language: "en" as const,
			});
		}

		// 5. gallery_image_translationsテーブルに挿入
		await db.insert(galleryImageTranslations).values(translationData);

		console.log(
			`  ✅ ${city.name}: ${insertedImages.length}件の画像と${translationData.length}件の翻訳を作成`
		);
	}

	console.log(`✅ 合計${totalImageCount}件のギャラリー画像を作成しました`);

	return totalImageCount;
}

/**
 * ランダムなステータスを取得
 * published: 60%, draft: 30%, archived: 10%
 */
function getRandomStatus(): "published" | "draft" | "archived" {
	const rand = Math.random();
	if (rand < 0.6) return "published";
	if (rand < 0.9) return "draft";
	return "archived";
}

/**
 * ランダムな公開日時を取得（現在から360日前まで）
 */
function getRandomDate(): string | null {
	const now = new Date();
	const start = new Date(now);
	start.setDate(now.getDate() - 360); // 360日前

	const randomTime =
		start.getTime() + Math.random() * (now.getTime() - start.getTime());
	return new Date(randomTime).toISOString();
}

/**
 * ランダムなCloudflare画像IDを取得（50%の確率でnull）
 */
function getRandomImageId(): string | null {
	if (Math.random() < 0.5) return null;
	const imageIds = [
		"tech-hero-001",
		"development-002",
		"coding-003",
		"web-design-004",
		"database-005",
		"ai-ml-006",
		"lifestyle-007",
		"remote-work-008",
		"productivity-009",
		"tutorial-010",
	];
	return imageIds[Math.floor(Math.random() * imageIds.length)];
}

/**
 * 記事タイトルテンプレートを取得
 */
function getTitleTemplates() {
	const templates = [
		// 技術系
		"TypeScript実践テクニック {i}",
		"React開発ベストプラクティス {i}",
		"Next.js パフォーマンス最適化 {i}",
		"Webアプリケーション設計 {i}",
		"データベース設計入門 {i}",
		"AI・機械学習の基礎 {i}",
		"JavaScript ES2024新機能 {i}",
		"CSS Grid レイアウト {i}",
		"GraphQL API設計 {i}",
		"Docker コンテナ化 {i}",
		"AWS クラウド構築 {i}",
		"セキュリティ対策 {i}",
		"テスト駆動開発 {i}",
		"DevOps プラクティス {i}",
		"マイクロサービス設計 {i}",

		// ライフスタイル・ワークスタイル
		"リモートワーク効率化 {i}",
		"プログラマーの生活術 {i}",
		"開発者の健康管理 {i}",
		"エンジニアのキャリア {i}",
		"チーム開発のコツ {i}",
		"フリーランス体験記 {i}",
		"技術勉強法 {i}",
		"デジタルデトックス {i}",
		"ワークライフバランス {i}",
		"副業プログラミング {i}",

		// 開発・デザイン
		"UI/UXデザイン原則 {i}",
		"アクセシビリティ対応 {i}",
		"レスポンシブ デザイン {i}",
		"デザインシステム構築 {i}",
		"プロトタイピング手法 {i}",
		"ユーザビリティテスト {i}",
		"情報アーキテクチャ {i}",
		"カラーパレット設計 {i}",
		"タイポグラフィ選択 {i}",
		"アニメーション実装 {i}",
	];

	return templates;
}

/**
 * 英語タイトルテンプレートを取得
 */
function getEnglishTitleTemplates() {
	const templates = [
		// Tech
		"TypeScript Practical Techniques {i}",
		"React Development Best Practices {i}",
		"Next.js Performance Optimization {i}",
		"Web Application Architecture {i}",
		"Database Design Fundamentals {i}",
		"AI & Machine Learning Basics {i}",
		"JavaScript ES2024 New Features {i}",
		"CSS Grid Layout Guide {i}",
		"GraphQL API Design {i}",
		"Docker Containerization {i}",
		"AWS Cloud Infrastructure {i}",
		"Security Best Practices {i}",
		"Test-Driven Development {i}",
		"DevOps Practices {i}",
		"Microservices Architecture {i}",

		// Lifestyle & Work
		"Remote Work Productivity {i}",
		"Programmer's Lifestyle {i}",
		"Developer Health Management {i}",
		"Engineer Career Path {i}",
		"Team Development Tips {i}",
		"Freelance Experience {i}",
		"Tech Learning Methods {i}",
		"Digital Detox Guide {i}",
		"Work-Life Balance {i}",
		"Side Project Programming {i}",

		// Development & Design
		"UI/UX Design Principles {i}",
		"Accessibility Implementation {i}",
		"Responsive Design Guide {i}",
		"Design System Building {i}",
		"Prototyping Methods {i}",
		"Usability Testing {i}",
		"Information Architecture {i}",
		"Color Palette Design {i}",
		"Typography Selection {i}",
		"Animation Implementation {i}",
	];

	return templates;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const createSeededRandom = (seed: number) => {
	let randomSeed = seed;
	return () => {
		randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296;
		return randomSeed / 4294967296;
	};
};

function generateContributionSeries(days = 365) {
	const seededRandom = createSeededRandom(123456);
	const now = Date.now();
	const contributions: Array<{
		date: string;
		jaCharCount: number;
		updatedAt: string;
	}> = [];

	for (let offset = days - 1; offset >= 0; offset -= 1) {
		const baseDate = new Date(now - offset * DAY_MS);
		const dateKey = toJstDateKey(baseDate);
		const jstDay = new Date(
			baseDate.getTime() + 9 * 60 * 60 * 1000
		).getUTCDay();
		const seasonalFactor = Math.sin(((days - offset) / days) * Math.PI * 2);
		let activityScore = 1.2 + seasonalFactor * 1.5 + seededRandom() * 2.5;

		if (jstDay === 0 || jstDay === 6) {
			activityScore *= 0.7;
		}

		if (seededRandom() > 0.94) {
			activityScore += 2 + seededRandom() * 3;
		}

		const bursts = Math.max(0, Math.round(activityScore));
		const avgCharsPerBurst = 350 + seededRandom() * 900;
		const jaCharCount = bursts > 0 ? Math.round(bursts * avgCharsPerBurst) : 0;

		contributions.push({
			date: dateKey,
			jaCharCount,
			updatedAt: new Date().toISOString(),
		});
	}

	return contributions;
}

/**
 * URL/Twitter/Amazon/YouTubeのテスト用セクションを返す
 *
 * 記事コンテンツの末尾に追加する外部サービスの埋め込みテスト用セクション。
 * リンクカードやOEmbed展開の動作確認に使用する。
 */
function getTestSections(isJapanese: boolean): string {
	const sections = isJapanese
		? [
				"## URL\n\nhttps://feature-sliced.github.io/documentation/ja/docs/get-started/overview",
				"## X(Twitter)\n\nhttps://x.com/saneatsu_wakana/status/1942564120492196102",
				"## Amazon\n### 通常URL\n\nhttps://www.amazon.co.jp/dp/B0DNVXHKR2?smid=A1EZDD7KGL6PDG&ref_=chk_typ_imgToDp&th=1",
				"### アフィリエイト通常URL\n\nhttps://www.amazon.co.jp/dp/B0DNVXHKR2?smid=A1EZDD7KGL6PDG&th=1&linkCode=ll1&tag=173069-22&linkId=5a950e14c744cee3b42daf2c0df615b5&language=ja_JP&ref_=as_li_ss_tl",
				"### アフィリエイト短縮URL\n\nhttps://amzn.to/3X18Ct3",
				"## Youtube\n### 通常URL\n\nhttps://www.youtube.com/watch?v=ispHaW-UyBE",
				"### 開始時間付きURL\n\nhttps://youtu.be/ispHaW-UyBE?si=I86bdulFXOhERv5g",
			]
		: [
				"## URL\n\nhttps://feature-sliced.github.io/documentation/ja/docs/get-started/overview",
				"## X(Twitter)\n\nhttps://x.com/saneatsu_wakana/status/1942564120492196102",
				"## Amazon\n### Regular URL\n\nhttps://www.amazon.co.jp/dp/B0DNVXHKR2?smid=A1EZDD7KGL6PDG&ref_=chk_typ_imgToDp&th=1",
				"### Affiliate Regular URL\n\nhttps://www.amazon.co.jp/dp/B0DNVXHKR2?smid=A1EZDD7KGL6PDG&th=1&linkCode=ll1&tag=173069-22&linkId=5a950e14c744cee3b42daf2c0df615b5&language=ja_JP&ref_=as_li_ss_tl",
				"### Affiliate Short URL\n\nhttps://amzn.to/3X18Ct3",
				"## Youtube\n### Regular URL\n\nhttps://www.youtube.com/watch?v=ispHaW-UyBE",
				"### URL with Start Time\n\nhttps://youtu.be/ispHaW-UyBE?si=I86bdulFXOhERv5g",
			];

	return sections.join("\n\n");
}

/**
 * テンプレートインデックスに対応する記事コンテンツを組み立てる
 *
 * ## Why
 * 横断AIチャット機能（Gemini Function Calling）のテスト用に、記事ごとにユニークなコンテンツが必要。
 * 35パターンのテンプレートから記事固有の本文を取得し、末尾にテスト用セクション（URL/Twitter/Amazon/YouTube）を付与する。
 *
 * 1. テンプレートインデックスに対応するコンテンツを取得
 * 2. 記事タイトルを見出しとして付与
 * 3. テスト用セクションを末尾に追加
 */
function buildArticleContent(
	title: string,
	templateIndex: number,
	isJapanese: boolean
): string {
	const template =
		ARTICLE_CONTENT_TEMPLATES[templateIndex % ARTICLE_CONTENT_TEMPLATES.length];
	const body = isJapanese ? template.ja : template.en;
	return `# ${title}\n\n${body}\n\n${getTestSections(isJapanese)}`;
}

/**
 * ランダムな閲覧数を取得
 * 記事のステータス、人気度、公開日からの経過日数に応じて現実的な数値を生成
 */
function getRandomViewCount(
	status: "published" | "draft" | "archived",
	publishedAt: string | null,
	isPopular: boolean = false
): number {
	// 下書き記事は閲覧数が少ない
	if (status === "draft") {
		return Math.floor(Math.random() * 11); // 0-10回
	}

	// 公開日からの経過日数を計算
	let daysFromPublished = 0;
	if (publishedAt) {
		const published = new Date(publishedAt);
		const now = new Date();
		daysFromPublished = Math.floor(
			(now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
		);
	}

	// 経過日数による基本閲覧数の調整
	// 公開から時間が経つほど多くの人に読まれる傾向
	const daysFactor = Math.min(daysFromPublished / 30, 10); // 最大10倍まで

	// 人気記事（全体の5%）
	if (isPopular) {
		const baseViews = Math.floor(Math.random() * 1500) + 500; // 500-2000回
		return Math.floor(baseViews * (1 + daysFactor * 0.5)); // 経過日数で最大1.5倍
	}

	// 通常の記事
	if (status === "published") {
		const rand = Math.random();
		let baseViews = 0;

		if (rand < 0.25) {
			// 25%: あまり読まれていない記事
			baseViews = Math.floor(Math.random() * 51); // 0-50回
		} else {
			// 75%: 普通の記事
			baseViews = Math.floor(Math.random() * 490) + 10; // 10-500回
		}

		return Math.floor(baseViews * (1 + daysFactor * 0.3)); // 経過日数で最大1.3倍
	}

	// アーカイブ済み記事は過去に人気だった可能性
	if (status === "archived") {
		const baseViews = Math.floor(Math.random() * 800) + 100; // 100-900回
		return Math.floor(baseViews * (1 + daysFactor * 0.2)); // 経過日数で最大1.2倍
	}

	return 0; // fallback
}

/**
 * 記事の閲覧数を日別に分散する
 * 過去90日間の各日付に対して、現実的な閲覧数を計算
 *
 * @param publishedAt - 記事の公開日時
 * @param totalViews - 記事の総閲覧数
 * @param articleId - 記事ID（ランダムシード用）
 * @returns 日付ごとの閲覧数の配列
 */
function distributeDailyViews(
	publishedAt: string | null,
	totalViews: number,
	articleId: number
): Array<{ date: string; views: number }> {
	// 公開されていない、または閲覧数が0の記事は空配列を返す
	if (!publishedAt || totalViews === 0) {
		return [];
	}

	const result: Array<{ date: string; views: number }> = [];
	const publishedDate = new Date(publishedAt);
	const now = new Date();

	// 90日前の日付を計算
	const ninetyDaysAgo = new Date(now);
	ninetyDaysAgo.setDate(now.getDate() - 90);

	// データ生成の開始日を決定（公開日と90日前の新しい方）
	const startDate =
		publishedDate > ninetyDaysAgo ? publishedDate : ninetyDaysAgo;

	// 開始日から現在までの日数を計算（今日を含める）
	const daysSinceStart =
		Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
		1;

	if (daysSinceStart <= 0) {
		return [];
	}

	// 記事IDベースのシード（記事ごとに異なるパターン）
	let randomSeed = articleId * 7919;
	const seededRandom = () => {
		randomSeed = (randomSeed * 9301 + 49297) % 233280;
		return randomSeed / 233280;
	};

	// 閲覧数を日別に分散
	const currentDate = new Date(startDate);
	let remainingViews = totalViews;
	const decayFactor = 0.95; // 日々の減衰率

	for (let day = 0; day < daysSinceStart && remainingViews > 0; day++) {
		let dailyMultiplier = 1;

		// 公開直後のピーク（最初の3日間）
		if (day === 0) {
			dailyMultiplier = 2.5 + seededRandom(); // 2.5-3.5倍
		} else if (day === 1) {
			dailyMultiplier = 2.0 + seededRandom() * 0.5; // 2.0-2.5倍
		} else if (day === 2) {
			dailyMultiplier = 1.5 + seededRandom() * 0.5; // 1.5-2.0倍
		} else if (day < 7) {
			// 最初の週は緩やかに減少
			dailyMultiplier = 1.2 - (day - 3) * 0.1 + seededRandom() * 0.2;
		} else {
			// その後は指数関数的に減衰 + ランダム変動
			dailyMultiplier = decayFactor ** (day / 7) * (0.5 + seededRandom() * 0.5);
		}

		// 週末効果（土日は平日の70-80%）
		const dayOfWeek = currentDate.getDay();
		if (dayOfWeek === 0 || dayOfWeek === 6) {
			dailyMultiplier *= 0.7 + seededRandom() * 0.1;
		}

		// 月曜日は少し増える
		if (dayOfWeek === 1) {
			dailyMultiplier *= 1.1;
		}

		// 基本の1日あたり閲覧数
		const baseViewsPerDay = totalViews / Math.max(daysSinceStart, 1);
		const dailyViews = Math.max(
			1,
			Math.floor(baseViewsPerDay * dailyMultiplier)
		);

		// 残り閲覧数を超えないように調整
		const actualDailyViews = Math.min(dailyViews, remainingViews);

		if (actualDailyViews > 0) {
			const dateStr = currentDate.toISOString().split("T")[0];
			result.push({ date: dateStr, views: actualDailyViews });
			remainingViews -= actualDailyViews;
		}

		currentDate.setDate(currentDate.getDate() + 1);
	}

	// 残った閲覧数を全日に均等に分散（端数処理）
	if (remainingViews > 0 && result.length > 0) {
		const viewsPerDay = Math.floor(remainingViews / result.length);
		const extraViews = remainingViews % result.length;

		// 各日に均等に追加
		for (let i = 0; i < result.length; i++) {
			result[i].views += viewsPerDay;
			// 余りを最初の数日に分散
			if (i < extraViews) {
				result[i].views += 1;
			}
		}
	}

	return result;
}

async function seed() {
	console.log("🌱 200件シードデータの作成を開始します...");
	console.log("📅 記事の公開日: 現在から360日前まで、日別閲覧数: 過去90日間");

	try {
		// すべてのテーブルをクリア
		await clearAllTables();

		// ユーザーを作成
		await db
			.insert(users)
			.values({
				email: "test@example.com",
				name: "テストユーザー",
				avatarUrl: "https://github.com/identicons/test.png",
				provider: "google",
				providerId: "123456789",
			})
			.returning();
		console.log("✅ ユーザーを作成しました");

		// 200件の記事を生成
		console.log("📝 200件の記事を生成中...");

		const articleDefinitions = [];
		// 人気記事をランダムに選択（全体の5%）
		const popularArticleCount = Math.floor(200 * 0.05);
		const popularArticleIndices = new Set<number>();
		while (popularArticleIndices.size < popularArticleCount) {
			popularArticleIndices.add(Math.floor(Math.random() * 200));
		}

		for (let i = 1; i <= 200; i++) {
			const status = getRandomStatus();
			const publishedAt = status === "published" ? getRandomDate() : null;
			const isPopular = popularArticleIndices.has(i - 1);
			const viewCount = getRandomViewCount(status, publishedAt, isPopular);

			articleDefinitions.push({
				slug: `article-${i.toString().padStart(3, "0")}`,
				status,
				publishedAt,
				cfImageId: getRandomImageId(),
				viewCount,
			});
		}

		// 記事をバッチで挿入
		const articleData = await db
			.insert(articles)
			.values(articleDefinitions)
			.returning();

		console.log("✅ 200件の記事を作成しました");

		// 記事の翻訳を生成
		console.log("🌐 記事の翻訳を生成中...");

		const titleTemplatesJa = getTitleTemplates();
		const titleTemplatesEn = getEnglishTitleTemplates();

		const articleTranslationData = [];

		for (let i = 0; i < articleData.length; i++) {
			const article = articleData[i];

			// 日本語版
			const titleJa = titleTemplatesJa[i % titleTemplatesJa.length].replace(
				"{i}",
				(i + 1).toString()
			);

			articleTranslationData.push({
				articleId: article.id,
				title: titleJa,
				content: buildArticleContent(
					titleJa,
					i % titleTemplatesJa.length,
					true
				),
				language: "ja" as const,
			});

			// 英語版
			const titleEn = titleTemplatesEn[i % titleTemplatesEn.length].replace(
				"{i}",
				(i + 1).toString()
			);

			articleTranslationData.push({
				articleId: article.id,
				title: titleEn,
				content: buildArticleContent(
					titleEn,
					i % titleTemplatesEn.length,
					false
				),
				language: "en" as const,
			});
		}

		// 翻訳をバッチで挿入
		await db.insert(articleTranslations).values(articleTranslationData);
		console.log("✅ 400件の翻訳を作成しました");

		// タグを生成
		console.log("🏷️  タグを生成中...");

		const tagDefinitions = [
			{ slug: "typescript", ja: "TypeScript", en: "TypeScript" },
			{ slug: "react", ja: "React", en: "React" },
			{ slug: "nextjs", ja: "Next.js", en: "Next.js" },
			{ slug: "javascript", ja: "JavaScript", en: "JavaScript" },
			{ slug: "css", ja: "CSS", en: "CSS" },
			{ slug: "graphql", ja: "GraphQL", en: "GraphQL" },
			{ slug: "docker", ja: "Docker", en: "Docker" },
			{ slug: "aws", ja: "AWS", en: "AWS" },
			{ slug: "database", ja: "データベース", en: "Database" },
			{ slug: "security", ja: "セキュリティ", en: "Security" },
			{ slug: "testing", ja: "テスト", en: "Testing" },
			{ slug: "devops", ja: "DevOps", en: "DevOps" },
			{ slug: "design", ja: "デザイン", en: "Design" },
			{ slug: "lifestyle", ja: "ライフスタイル", en: "Lifestyle" },
			{ slug: "career", ja: "キャリア", en: "Career" },
			{ slug: "tutorial", ja: "チュートリアル", en: "Tutorial" },
			{
				slug: "best-practices",
				ja: "ベストプラクティス",
				en: "Best Practices",
			},
			{ slug: "performance", ja: "パフォーマンス", en: "Performance" },
			{ slug: "ui-ux", ja: "UI/UX", en: "UI/UX" },
			{ slug: "accessibility", ja: "アクセシビリティ", en: "Accessibility" },
		];

		// タグを挿入
		const tagData = await db
			.insert(tags)
			.values(tagDefinitions.map((tag) => ({ slug: tag.slug })))
			.returning();

		console.log(`✅ ${tagData.length}件のタグを作成しました`);

		// タグ翻訳を生成
		console.log("🌐 タグ翻訳を生成中...");

		const tagTranslationData = [];
		for (let i = 0; i < tagData.length; i++) {
			const tag = tagData[i];
			const tagDef = tagDefinitions[i];

			// 日本語の翻訳
			tagTranslationData.push({
				tagId: tag.id,
				name: tagDef.ja,
				language: "ja" as const,
			});

			// 英語の翻訳
			tagTranslationData.push({
				tagId: tag.id,
				name: tagDef.en,
				language: "en" as const,
			});
		}

		// タグ翻訳を挿入
		await db.insert(tagTranslations).values(tagTranslationData);
		console.log(`✅ ${tagTranslationData.length}件のタグ翻訳を作成しました`);

		// 記事とタグを関連付け
		console.log("🔗 記事とタグを関連付け中...");

		const articleTagsData = [];

		// タグのスラッグとIDのマッピングを作成
		const tagSlugToId = new Map(
			tagData.map((tag, index) => [tagDefinitions[index].slug, tag.id])
		);

		// 各記事にタグを割り当て
		for (let i = 0; i < articleData.length; i++) {
			const article = articleData[i];
			const titleJa = titleTemplatesJa[i % titleTemplatesJa.length];

			// タイトルに基づいてタグを選択
			const articleTagSlugs: string[] = [];

			// 技術系タグの割り当て
			if (titleJa.includes("TypeScript")) articleTagSlugs.push("typescript");
			if (titleJa.includes("React")) articleTagSlugs.push("react");
			if (titleJa.includes("Next.js")) articleTagSlugs.push("nextjs");
			if (titleJa.includes("JavaScript")) articleTagSlugs.push("javascript");
			if (titleJa.includes("CSS")) articleTagSlugs.push("css");
			if (titleJa.includes("GraphQL")) articleTagSlugs.push("graphql");
			if (titleJa.includes("Docker")) articleTagSlugs.push("docker");
			if (titleJa.includes("AWS")) articleTagSlugs.push("aws");
			if (titleJa.includes("データベース")) articleTagSlugs.push("database");
			if (titleJa.includes("セキュリティ")) articleTagSlugs.push("security");
			if (titleJa.includes("テスト")) articleTagSlugs.push("testing");
			if (titleJa.includes("DevOps")) articleTagSlugs.push("devops");

			// カテゴリタグの割り当て
			if (titleJa.includes("デザイン") || titleJa.includes("UI/UX"))
				articleTagSlugs.push("design");
			if (titleJa.includes("リモートワーク") || titleJa.includes("ライフ"))
				articleTagSlugs.push("lifestyle");
			if (titleJa.includes("キャリア") || titleJa.includes("フリーランス"))
				articleTagSlugs.push("career");
			if (titleJa.includes("入門") || titleJa.includes("ガイド"))
				articleTagSlugs.push("tutorial");
			if (titleJa.includes("ベストプラクティス") || titleJa.includes("最適化"))
				articleTagSlugs.push("best-practices");
			if (titleJa.includes("パフォーマンス"))
				articleTagSlugs.push("performance");
			if (titleJa.includes("アクセシビリティ"))
				articleTagSlugs.push("accessibility");

			// タグが割り当てられなかった場合、ランダムに1-3個選択
			if (articleTagSlugs.length === 0) {
				const randomTagCount = Math.floor(Math.random() * 3) + 1; // 1-3個
				const availableTags = [...tagDefinitions];
				for (let j = 0; j < randomTagCount; j++) {
					const randomIndex = Math.floor(Math.random() * availableTags.length);
					articleTagSlugs.push(availableTags[randomIndex].slug);
					availableTags.splice(randomIndex, 1);
				}
			}

			// 重複を削除
			const uniqueTagSlugs = [...new Set(articleTagSlugs)];

			// article_tagsレコードを作成
			for (const tagSlug of uniqueTagSlugs) {
				const tagId = tagSlugToId.get(tagSlug);
				if (tagId) {
					articleTagsData.push({
						articleId: article.id,
						tagId: tagId,
					});
				}
			}
		}

		// 記事とタグの関連付けを挿入
		await db.insert(articleTags).values(articleTagsData);
		console.log(
			`✅ ${articleTagsData.length}件の記事-タグ関連付けを作成しました`
		);

		// 日別閲覧数を生成
		console.log("📊 日別閲覧数を生成中...");

		// すべての記事の日別閲覧数を計算
		const dailyViewsMap = new Map<string, number>();

		for (let i = 0; i < articleData.length; i++) {
			const article = articleData[i];

			// 記事全体の閲覧数を使用
			const articleViewCount = article.viewCount || 0;

			// 記事の閲覧数を日別に分散
			const dailyViews = distributeDailyViews(
				article.publishedAt,
				articleViewCount,
				article.id
			);

			// 日別閲覧数を合算
			for (const { date, views } of dailyViews) {
				const currentViews = dailyViewsMap.get(date) || 0;
				dailyViewsMap.set(date, currentViews + views);
			}
		}

		// daily_article_viewsテーブルに挿入
		const dailyViewsData = Array.from(dailyViewsMap.entries()).map(
			([date, viewCount]) => ({
				date,
				viewCount,
			})
		);

		// 日付順にソート
		dailyViewsData.sort((a, b) => a.date.localeCompare(b.date));

		await db.insert(dailyArticleViews).values(dailyViewsData);
		console.log(`✅ ${dailyViewsData.length}件の日別閲覧数を作成しました`);

		const contributionData = generateContributionSeries();
		await db.insert(dailyArticleContributions).values(contributionData);
		console.log(
			`✅ ${contributionData.length}件の執筆データ（直近1年分）を作成しました`
		);

		// ギャラリー画像を生成
		const galleryImageCount = await seedGalleryImages();

		// 記事とギャラリー画像を紐付け
		console.log("🔗 記事とギャラリー画像を紐付け中...");

		// データベースから実際のギャラリー画像IDを取得
		const allGalleryImages = await db
			.select({ id: galleryImages.id })
			.from(galleryImages);
		const galleryImageIds = allGalleryImages.map((img) => img.id);

		const articleGalleryImagesData = [];

		// 最初の20件の記事にギャラリー画像を紐付ける
		// 各記事に1〜5枚のギャラリー画像をランダムに割り当て
		for (let i = 0; i < Math.min(20, articleData.length); i++) {
			const article = articleData[i];

			// この記事に紐付けるギャラリー画像の数をランダムに決定（1〜5枚）
			const imageCount = Math.min(
				Math.floor(Math.random() * 5) + 1,
				galleryImageIds.length
			);

			// ランダムにギャラリー画像を選択（重複なし）
			const selectedImageIds = new Set<number>();
			const availableIds = [...galleryImageIds];
			while (selectedImageIds.size < imageCount) {
				const randomIndex = Math.floor(Math.random() * availableIds.length);
				selectedImageIds.add(availableIds[randomIndex]);
				availableIds.splice(randomIndex, 1);
			}

			// article_gallery_imagesレコードを作成
			for (const galleryImageId of selectedImageIds) {
				articleGalleryImagesData.push({
					articleId: article.id,
					galleryImageId,
				});
			}
		}

		await db.insert(articleGalleryImages).values(articleGalleryImagesData);
		console.log(
			`✅ ${articleGalleryImagesData.length}件の記事-ギャラリー画像の紐付けを作成しました`
		);

		console.log("🎉 200件シードデータの作成が完了しました！");

		// 閲覧数の統計を計算
		const totalViewCount = articleData.reduce(
			(sum, article) => sum + (article.viewCount || 0),
			0
		);
		const popularCount = popularArticleIndices.size;
		const avgViewCount = Math.round(totalViewCount / articleData.length);

		console.log(`
📊 作成されたデータ:
- ユーザー: 1件
- 記事: ${articleData.length}件（公開日: 過去360日間に分散、viewCount付き）
- 記事翻訳: ${articleTranslationData.length}件
- タグ: ${tagData.length}件
- タグ翻訳: ${tagTranslationData.length}件（日本語・英語）
- 記事-タグ関連付け: ${articleTagsData.length}件
- 日別閲覧数: ${dailyViewsData.length}件（過去90日間の日別データ）
- 執筆データ: ${contributionData.length}件（直近365日）
- ギャラリー画像: ${galleryImageCount}件（撮影日: 過去1年間に分散、16都市）
- ギャラリー画像翻訳: ${galleryImageCount * 2}件（日本語・英語）
- 記事-ギャラリー画像関連付け: ${articleGalleryImagesData.length}件（最初の20記事に1〜5枚ずつ）

📈 閲覧数統計:
- 合計閲覧数: ${totalViewCount.toLocaleString()}回（記事全体）
- 平均閲覧数: ${avgViewCount}回/記事
- 人気記事数: ${popularCount}件（全体の5%）
- 閲覧数は記事全体でカウントされ、公開日からの経過日数を考慮して生成
- 日別閲覧数は過去90日間の現実的なパターン（公開直後ピーク、週末効果）で分散

🖼️  ギャラリー統計:
- 東京: 20件、その他15都市: 各2件
- 全画像で共通のCloudflare Images ID使用
- 座標は各都市の中心から±0.1度の範囲でランダム配置
		`);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

// スクリプトを実行
seed().catch(console.error);
