import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MessageContent } from "./message-content";

// streamdownのコンポーネントをモックして、Markdown変換結果をテスト可能にする
vi.mock("streamdown", () => ({
	Streamdown: ({
		children,
		isAnimating,
	}: {
		children: string;
		isAnimating?: boolean;
	}) => (
		<div data-testid="streamdown" data-is-animating={isAnimating}>
			{children}
		</div>
	),
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
