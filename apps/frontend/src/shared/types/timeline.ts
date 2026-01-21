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
 * 期間、タイトル、説明、カテゴリ、技術スタックなどの情報を持つ。
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
	 * タイトル・役職
	 *
	 * @example "株式会社Example / フロントエンドエンジニア"
	 * @example "○○大学 情報工学部"
	 * @example "個人ブログサイトの開発"
	 */
	title: string;

	/**
	 * 詳細な説明
	 *
	 * @description
	 * その経歴での取り組みや成果を説明する。
	 */
	description: string;

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
};
