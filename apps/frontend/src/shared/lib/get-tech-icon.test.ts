import {
	siPython,
	siReact,
	siRemix,
	siShadcnui,
	siTailwindcss,
} from "simple-icons";
import { describe, expect, it } from "vitest";

import { TECH_STACK_NAMES } from "@/shared/config";

import { getTechIcon, getTechMeta } from "./get-tech-icon";

/**
 * getTechIcon / getTechMeta のテスト
 *
 * @description
 * 経歴詳細の技術スタックは翻訳JSON由来の文字列を SSOT（tech-stack.ts）から解決する。
 * ここでは「解決できるべき技術がフォールバックにならない」ことを保証し、
 * 過去に起きた「ReactやRemixがアイコン化されず頭文字表示になる」不具合の再発を防ぐ。
 */
describe("get-tech-icon", () => {
	describe("Unit Test", () => {
		describe("getTechIcon", () => {
			it("returns the matching SimpleIcon for a canonical name", () => {
				// Given / When / Then: 正規名でSimpleIconが解決できる
				expect(getTechIcon("Python")).toBe(siPython);
				expect(getTechIcon("React")).toBe(siReact);
				expect(getTechIcon("Remix")).toBe(siRemix);
			});

			it("resolves names that contain symbols or spaces", () => {
				// Given / When / Then: 記号・空白を含む名前も解決できる
				expect(getTechIcon("Tailwind CSS")).toBe(siTailwindcss);
				expect(getTechIcon("shadcn/ui")).toBe(siShadcnui);
			});

			it("is case-insensitive and trims surrounding whitespace", () => {
				// Given / When / Then: 大文字小文字・前後空白を無視して解決できる
				expect(getTechIcon("react")).toBe(siReact);
				expect(getTechIcon("  REMIX  ")).toBe(siRemix);
			});

			it("returns undefined for an unknown name", () => {
				// Given / When / Then: 未知の技術名はundefinedを返す
				expect(getTechIcon("UnknownTech")).toBeUndefined();
				expect(getTechIcon("")).toBeUndefined();
			});

			it("returns undefined for a tech that has no SimpleIcon (renderIcon only)", () => {
				// Given / When / Then: renderIconのみの技術はSimpleIconを持たない
				expect(getTechIcon("AWS")).toBeUndefined();
				expect(getTechIcon("Playwright")).toBeUndefined();
			});
		});

		describe("getTechMeta", () => {
			it("returns renderIcon and backgroundColor for icons not in simple-icons", () => {
				// Given / When / Then: simple-iconsに無い技術もrenderIcon/背景色で表現できる
				const aws = getTechMeta("AWS");
				expect(aws?.renderIcon).toBeDefined();
				expect(aws?.backgroundColor).toBe("#E8EAED");

				const playwright = getTechMeta("Playwright");
				expect(playwright?.renderIcon).toBeDefined();
				expect(playwright?.backgroundColor).toBe("#4E6D82");
			});

			it("returns the category for a known tech", () => {
				// Given / When / Then: メタ情報にはカテゴリが含まれる
				expect(getTechMeta("React")?.category).toBe("frameworks");
				expect(getTechMeta("Python")?.category).toBe("languages");
				expect(getTechMeta("PostgreSQL")?.category).toBe("databases");
				expect(getTechMeta("Git")?.category).toBe("tools");
			});

			it("returns undefined for an unknown name", () => {
				// Given / When / Then: 未知の技術名はundefinedを返す
				expect(getTechMeta("UnknownTech")).toBeUndefined();
			});
		});

		describe("coverage over all TECH_STACK_NAMES", () => {
			it("every registered tech resolves to a renderable badge (icon, renderIcon, or backgroundColor)", () => {
				// Given: SSOTに登録された全技術名
				// When / Then: いずれも頭文字フォールバックにならず、何らかの表現手段を持つ
				const notRenderable = TECH_STACK_NAMES.filter((name) => {
					const meta = getTechMeta(name);
					return (
						!meta || (!meta.icon && !meta.renderIcon && !meta.backgroundColor)
					);
				});
				expect(notRenderable).toEqual([]);
			});
		});
	});
});
