import { cleanup, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MessageContent } from "./message-content";

// streamdownのコンポーネントをモックして、Markdown変換結果をテスト可能にする
// componentsプロップで渡されたカスタムコンポーネントも実際にレンダリングする
vi.mock("streamdown", () => ({
	Streamdown: ({
		children,
		isAnimating,
		components,
	}: {
		children: string;
		isAnimating?: boolean;
		components?: Record<
			string,
			React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement>>
		>;
	}) => {
		// Markdownリンク記法 [text](url) を検出してカスタムaコンポーネントでレンダリング
		const CustomAnchor = components?.a;
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		let match = linkRegex.exec(children);
		while (match !== null) {
			if (match.index > lastIndex) {
				parts.push(children.slice(lastIndex, match.index));
			}
			const [, text, href] = match;
			if (CustomAnchor) {
				parts.push(
					<CustomAnchor key={match.index} href={href}>
						{text}
					</CustomAnchor>
				);
			} else {
				parts.push(
					<a key={match.index} href={href}>
						{text}
					</a>
				);
			}
			lastIndex = match.index + match[0].length;
			match = linkRegex.exec(children);
		}
		if (lastIndex < children.length) {
			parts.push(children.slice(lastIndex));
		}

		return (
			<div data-testid="streamdown" data-is-animating={isAnimating}>
				{parts.length > 0 ? parts : children}
			</div>
		);
	},
}));

vi.mock("@streamdown/code", () => ({
	code: {},
}));

afterEach(() => {
	cleanup();
});

describe("MessageContent", () => {
	describe("Unit Test", () => {
		it("renders plain text content", () => {
			// Given: プレーンテキストのコンテンツ
			const content = "これはテストメッセージです";

			// When: MessageContentをレンダリング
			render(<MessageContent content={content} />);

			// Then: テキストが表示される
			expect(screen.getByText(content)).toBeInTheDocument();
		});

		it("wraps content in prose container for Markdown styling", () => {
			// Given: Markdownコンテンツ
			const content = "# 見出し\n\nテキスト";

			// When: MessageContentをレンダリング
			const { container } = render(<MessageContent content={content} />);

			// Then: proseクラスのコンテナで囲まれている
			const wrapper = container.firstChild as HTMLElement;
			expect(wrapper.className).toContain("prose");
			expect(wrapper.className).toContain("prose-sm");
			expect(wrapper.className).toContain("dark:prose-invert");
		});

		it("passes content to Streamdown component", () => {
			// Given: Markdownコンテンツ
			const content = "**太字** と `コード`";

			// When: MessageContentをレンダリング
			render(<MessageContent content={content} />);

			// Then: Streamdownにコンテンツが渡されている
			const streamdown = screen.getByTestId("streamdown");
			expect(streamdown).toHaveTextContent(content);
		});

		it("defaults isStreaming to false", () => {
			// Given: isStreamingを指定しない
			render(<MessageContent content="テスト" />);

			// When: Streamdownの属性を確認
			const streamdown = screen.getByTestId("streamdown");

			// Then: isAnimatingがfalseになっている
			expect(streamdown.dataset.isAnimating).toBe("false");
		});

		it("passes isStreaming as isAnimating to Streamdown", () => {
			// Given: ストリーミング中の状態
			render(<MessageContent content="ストリーミング中..." isStreaming />);

			// When: Streamdownの属性を確認
			const streamdown = screen.getByTestId("streamdown");

			// Then: isAnimatingがtrueになっている
			expect(streamdown.dataset.isAnimating).toBe("true");
		});

		it("renders article links with target='_blank' and rel='noopener noreferrer'", () => {
			// Given: 記事リンクを含むMarkdownコンテンツ
			const content =
				"詳しくは[Next.jsの基本](/blog/nextjs-basics)を参照してください";

			// When: MessageContentをレンダリング
			render(<MessageContent content={content} />);

			// Then: リンクにtarget="_blank"とrel="noopener noreferrer"が設定される
			const link = screen.getByRole("link", { name: "Next.jsの基本" });
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
			expect(link).toHaveAttribute("href", "/blog/nextjs-basics");
		});

		it("renders external links with target='_blank' and rel='noopener noreferrer'", () => {
			// Given: 外部リンクを含むMarkdownコンテンツ
			const content =
				"参考: [React公式ドキュメント](https://react.dev)をご覧ください";

			// When: MessageContentをレンダリング
			render(<MessageContent content={content} />);

			// Then: 外部リンクにもtarget="_blank"とrel="noopener noreferrer"が設定される
			const link = screen.getByRole("link", {
				name: "React公式ドキュメント",
			});
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
			expect(link).toHaveAttribute("href", "https://react.dev");
		});

		it("preserves href correctly for all link types", () => {
			// Given: 記事リンクと外部リンクの両方を含むコンテンツ
			const content = "[記事](/blog/test)と[外部](https://example.com)のリンク";

			// When: MessageContentをレンダリング
			render(<MessageContent content={content} />);

			// Then: 両方のhrefが正しく設定される
			const links = screen.getAllByRole("link");
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAttribute("href", "/blog/test");
			expect(links[1]).toHaveAttribute("href", "https://example.com");
		});

		it("has overflow-hidden to prevent content overflow", () => {
			// Given: 長いコンテンツ
			const content = "長いコンテンツ";

			// When: MessageContentをレンダリング
			const { container } = render(<MessageContent content={content} />);

			// Then: overflow-hiddenクラスが適用されている
			const wrapper = container.firstChild as HTMLElement;
			expect(wrapper.className).toContain("overflow-hidden");
		});
	});
});
