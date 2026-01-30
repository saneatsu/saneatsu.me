import type { SimpleIcon } from "simple-icons";

/**
 * タイムラインアイテムのカテゴリ
 *
 * @description
 * 経歴の種類を分類するための列挙型。
 * 職歴、学歴、プロジェクト、技術習得などを区別する。
 */
export type TimelineItemCategory =
	| "work" // 職歴
	| "education" // 学歴
	| "project" // 個人プロジェクト
	| "skill"; // 技術習得・マイルストーン

/**
 * タイムラインアイテムの説明項目
 *
 * @description
 * 経歴の詳細説明を構造化するための型。
 * 各項目にはタイトル、内容、技術スタック、その他の情報を含めることができる。
 */
export type TimelineItemDescription = {
	/**
	 * 項目のタイトル
	 *
	 * @example "2017-12: 社内プロダクトの開発"
	 */
	title: string;

	/**
	 * 業務内容の説明
	 *
	 * @description
	 * Markdown形式で記述可能。
	 */
	content: string;

	/**
	 * 使用技術スタック（オプショナル）
	 *
	 * @description
	 * その項目で使用した技術名の配列。
	 * 表示時にsimple-iconsから対応するアイコンを取得してバッジ形式で表示する。
	 *
	 * @example ["Python", "Django"]
	 * @example ["VBA"]
	 */
	techStack?: string[];

	/**
	 * その他の情報（オプショナル）
	 *
	 * @description
	 * Markdown形式で記述可能。
	 */
	other?: string;
};

/**
 * タイムラインアイテムの期間
 *
 * @description
 * 経歴の期間を表す型。
 * 開始日と終了日、または現在進行中かどうかを表すフラグを持つ。
 */
export type TimelineItemPeriod = {
	/**
	 * 開始日（必須）
	 * YYYY-MM形式または年のみ
	 *
	 * @example "2020-04"
	 * @example "2020"
	 */
	from: string;

	/**
	 * 終了日（nullable、現在進行中の場合はnull）
	 * YYYY-MM形式または年のみ
	 *
	 * @example "2023-03"
	 * @example "2023"
	 * @example null // 現在進行中
	 */
	to: string | null;
};

/**
 * タイムラインアイテム
 *
 * @description
 * 経歴の1つの項目を表す型。
 * 期間、会社名、役職、説明、カテゴリ、技術スタックなどの情報を持つ。
 */
export type TimelineItem = {
	/**
	 * スラッグ（必須）
	 * 言語に依存しない一意の識別子
	 *
	 * @example "freelancer"
	 * @example "algoage-inc"
	 * @example "accenture"
	 */
	slug: string;

	/**
	 * 経歴の期間
	 */
	period: TimelineItemPeriod;

	/**
	 * 会社名・組織名
	 *
	 * @example "株式会社Example"
	 * @example "○○大学"
	 * @example "個人ブログサイトの開発"
	 */
	companyName: string;

	/**
	 * 役職・ロール（オプショナル、複数可）
	 *
	 * @description
	 * その経歴での役職やロールの配列。
	 * 複数の役職を同時に担当していた場合などに使用する。
	 *
	 * @example ["フロントエンドエンジニア", "テックリード"]
	 * @example ["ソフトウェアエンジニア"]
	 */
	role?: string[];

	/**
	 * 詳細な説明
	 *
	 * @description
	 * その経歴での取り組みや成果を説明する。
	 * 配列形式で複数の項目を構造化して記述できる。
	 */
	description: TimelineItemDescription[];

	/**
	 * カテゴリ
	 */
	category: TimelineItemCategory;

	/**
	 * 技術スタック（オプショナル）
	 *
	 * @description
	 * その経歴で使用した技術やツールのアイコンの配列。
	 * simple-iconsのSimpleIcon型を使用する。
	 */
	techStack?: SimpleIcon[];

	/**
	 * 会社ロゴのURL（オプショナル）
	 *
	 * @description
	 * 会社や組織のロゴ画像のパス。
	 * `/company-logo/{slug}-logo.{ext}`形式を想定。
	 *
	 * @example "/company-logo/accenture-logo.svg"
	 */
	logoUrl?: string;

	/**
	 * 雇用形態（オプショナル）
	 *
	 * @description
	 * その経歴での雇用形態を表す文字列。
	 * 例: "正社員", "契約社員", "フリーランス"など
	 *
	 * @example "正社員"
	 * @example "Full-time Employee"
	 */
	employmentType?: string;
};
