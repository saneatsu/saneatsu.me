// StorybookのtsconfigはNext.jsの自動生成型(next-env.d.ts)を参照しないため、
// 副作用importしたglobals.cssなどを型エラーなく扱うには手動でモジュール宣言が必要。
declare module "*.css" {
	const content: Record<string, string>;
	export default content;
}

declare module "*.scss" {
	const content: Record<string, string>;
	export default content;
}

declare module "*.sass" {
	const content: Record<string, string>;
	export default content;
}

declare module "*.less" {
	const content: Record<string, string>;
	export default content;
}
