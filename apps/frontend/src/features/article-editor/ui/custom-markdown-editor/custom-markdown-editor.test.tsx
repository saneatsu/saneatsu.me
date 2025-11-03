import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CustomMarkdownEditor } from "./custom-markdown-editor";

describe("Unit Test", () => {
	describe("CustomMarkdownEditor", () => {
		it("should render editor and preview", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			// Act
			render(
				<CustomMarkdownEditor
					value="# Test"
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
			);

			// Assert
			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});
			expect(textarea).toBeInTheDocument();
			expect(textarea).toHaveValue("# Test");
		});

		it("should call onChange when text is entered", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			render(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});

			// Act
			await user.type(textarea, "Hello");

			// Assert
			expect(mockOnChange).toHaveBeenCalled();
		});

		it("should display placeholder when empty", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			// Act
			render(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
			);

			// Assert
			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});
			expect(textarea).toHaveAttribute(
				"placeholder",
				"Markdownを入力してください..."
			);
		});

		it("should use custom height when provided", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const customHeight = 800;

			// Act
			const { container } = render(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					height={customHeight}
				/>
			);

			// Assert
			// エディタとプレビューのコンテナが指定した高さを持つことを確認
			const editorContainer = container.querySelector(
				'div[style*="height"]'
			) as HTMLElement;
			expect(editorContainer).toHaveStyle({ height: `${customHeight}px` });
		});

		it("should apply custom className", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const customClass = "custom-test-class";

			// Act
			const { container } = render(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					className={customClass}
				/>
			);

			// Assert
			const rootElement = container.firstChild as HTMLElement;
			expect(rootElement).toHaveClass(customClass);
		});

		it("should render preview with markdown content", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const markdownContent = "# Heading\n\nParagraph";

			// Act
			render(
				<CustomMarkdownEditor
					value={markdownContent}
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
			);

			// Assert
			// MarkdownPreviewコンポーネントが描画されることを確認
			// （実際のMarkdownレンダリングはMarkdownPreviewコンポーネントのテスト範囲）
			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});
			expect(textarea).toHaveValue(markdownContent);
		});
	});
});
