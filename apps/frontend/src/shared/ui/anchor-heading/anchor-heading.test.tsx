import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AnchorHeading } from "./anchor-heading";

describe("AnchorHeading", () => {
	describe("Unit Test", () => {
		describe("id attribute", () => {
			test("h2 heading has the specified id", () => {
				// Given: h2 level with id "experience"
				// When: rendered
				render(
					<AnchorHeading level="h2" id="experience">
						経歴
					</AnchorHeading>
				);

				// Then: heading element has the correct id
				const heading = screen.getByRole("heading", { level: 2 });
				expect(heading).toHaveAttribute("id", "experience");
			});

			test("h3 heading has the specified id", () => {
				// Given: h3 level with id "tech-languages"
				// When: rendered
				render(
					<AnchorHeading level="h3" id="tech-languages">
						言語
					</AnchorHeading>
				);

				// Then: heading element has the correct id
				const heading = screen.getByRole("heading", { level: 3 });
				expect(heading).toHaveAttribute("id", "tech-languages");
			});
		});

		describe("anchor link href", () => {
			test("anchor link href matches the heading id with # prefix", () => {
				// Given: heading with id "blog"
				// When: rendered
				render(
					<AnchorHeading level="h2" id="blog">
						ブログ
					</AnchorHeading>
				);

				// Then: link href is "#blog"
				const link = screen.getByRole("link");
				expect(link).toHaveAttribute("href", "#blog");
			});
		});

		describe("aria-label", () => {
			test("aria-label contains text content when children is a string", () => {
				// Given: heading with string children
				// When: rendered
				render(
					<AnchorHeading level="h2" id="contact">
						連絡先
					</AnchorHeading>
				);

				// Then: aria-label includes the heading text
				const link = screen.getByRole("link");
				expect(link).toHaveAttribute("aria-label", "連絡先へのリンク");
			});

			test("aria-label falls back to id when children is not a string", () => {
				// Given: heading with non-string children
				// When: rendered
				render(
					<AnchorHeading level="h2" id="tech">
						<span>技術スタック</span>
					</AnchorHeading>
				);

				// Then: aria-label uses the id as fallback
				const link = screen.getByRole("link");
				expect(link).toHaveAttribute("aria-label", "techへのリンク");
			});
		});

		describe("heading level", () => {
			test("renders h2 element when level is h2", () => {
				// Given: level "h2"
				// When: rendered
				render(
					<AnchorHeading level="h2" id="test-h2">
						h2テスト
					</AnchorHeading>
				);

				// Then: h2 element exists
				expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
			});

			test("renders h3 element when level is h3", () => {
				// Given: level "h3"
				// When: rendered
				render(
					<AnchorHeading level="h3" id="test-h3">
						h3テスト
					</AnchorHeading>
				);

				// Then: h3 element exists
				expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
			});
		});

		describe("styling", () => {
			test("h2 has text-2xl font-bold classes", () => {
				// Given: h2 level
				// When: rendered
				render(
					<AnchorHeading level="h2" id="styled-h2">
						スタイルテスト
					</AnchorHeading>
				);

				// Then: correct styling classes are applied
				const heading = screen.getByRole("heading", { level: 2 });
				expect(heading.className).toContain("text-2xl");
				expect(heading.className).toContain("font-bold");
			});

			test("h3 has text-lg font-semibold classes", () => {
				// Given: h3 level
				// When: rendered
				render(
					<AnchorHeading level="h3" id="styled-h3">
						スタイルテスト
					</AnchorHeading>
				);

				// Then: correct styling classes are applied
				const heading = screen.getByRole("heading", { level: 3 });
				expect(heading.className).toContain("text-lg");
				expect(heading.className).toContain("font-semibold");
			});

			test("custom className is applied", () => {
				// Given: custom className "mb-3"
				// When: rendered
				render(
					<AnchorHeading level="h2" id="custom" className="mb-3">
						カスタム
					</AnchorHeading>
				);

				// Then: custom class is included
				const heading = screen.getByRole("heading", { level: 2 });
				expect(heading.className).toContain("mb-3");
			});

			test("scroll-mt-20 class is applied for navbar offset", () => {
				// Given: any heading
				// When: rendered
				render(
					<AnchorHeading level="h2" id="scroll-test">
						スクロールテスト
					</AnchorHeading>
				);

				// Then: scroll margin class is applied
				const heading = screen.getByRole("heading", { level: 2 });
				expect(heading.className).toContain("scroll-mt-20");
			});
		});

		describe("link icon", () => {
			test("link icon is hidden from accessibility tree", () => {
				// Given: any heading
				// When: rendered
				render(
					<AnchorHeading level="h2" id="icon-test">
						アイコンテスト
					</AnchorHeading>
				);

				// Then: SVG icon has aria-hidden
				const link = screen.getByRole("link");
				const icon = link.querySelector("svg");
				expect(icon).toHaveAttribute("aria-hidden", "true");
			});
		});
	});
});
