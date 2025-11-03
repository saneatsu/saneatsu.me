import jaMessages from "@saneatsu/i18n/src/locales/ja.json";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { CustomMarkdownEditor } from "./custom-markdown-editor";

/**
 * next-intlプロバイダーでラップしたカスタムrender関数
 *
 * @description
 * QueryClientProviderとNextIntlClientProviderの両方でラップする。
 * ArticleSuggestionsPopoverがTanStack Queryを使用しているため、
 * QueryClientProviderが必要。
 */
function renderWithIntl(ui: React.ReactElement) {
	// テスト用のQueryClientを作成
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// テストでは自動リトライしない
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<NextIntlClientProvider locale="ja" messages={jaMessages as any}>
				{ui}
			</NextIntlClientProvider>
		</QueryClientProvider>,
	);
}

describe("Unit Test", () => {
	describe("CustomMarkdownEditor", () => {
		it("should render editor and preview", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			// Act
			renderWithIntl(
				<CustomMarkdownEditor
					value="# Test"
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
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

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
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
			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			// Assert
			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});
			expect(textarea).toHaveAttribute(
				"placeholder",
				"Markdownを入力してください...",
			);
		});

		it("should use custom height when provided", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const customHeight = 800;

			// Act
			const { container } = renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					height={customHeight}
				/>,
			);

			// Assert
			// エディタとプレビューのコンテナが指定した高さを持つことを確認
			const editorContainer = container.querySelector(
				'div[style*="height"]',
			) as HTMLElement;
			expect(editorContainer).toHaveStyle({ height: `${customHeight}px` });
		});

		it("should apply custom className", () => {
			// Arrange
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const customClass = "custom-test-class";

			// Act
			const { container } = renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					className={customClass}
				/>,
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
			renderWithIntl(
				<CustomMarkdownEditor
					value={markdownContent}
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
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

	describe("Bracket Auto-completion", () => {
		it("should auto-complete brackets when [ is typed", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			await user.keyboard("{[}");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("[]");
		});

		it("should auto-complete to [[]] when [[ is typed", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value="["
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// カーソルを最後に移動
			textarea.setSelectionRange(1, 1);

			// Act
			await user.click(textarea);
			await user.keyboard("{[}");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("[[]]");
		});

		it("should auto-complete parentheses", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});

			// Act
			await user.click(textarea);
			await user.keyboard("(");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("()");
		});

		it("should auto-complete curly braces", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});

			// Act
			await user.click(textarea);
			await user.keyboard("{{}");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("{}");
		});

		it("should wrap selected text with brackets", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value="hello"
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			// クリック後に全選択
			textarea.setSelectionRange(0, 5);
			textarea.focus();
			await user.keyboard("{[}");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("[hello]");
		});

		it("should skip closing bracket when cursor is before it", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value="[]"
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			// クリック後にカーソルを ] の直前に配置
			textarea.setSelectionRange(1, 1);
			textarea.focus();
			await user.keyboard("]");

			// Assert
			// 値は変更されず、カーソルだけが移動する
			expect(mockOnChange).not.toHaveBeenCalled();
			expect(textarea.selectionStart).toBe(2);
		});

		it("should auto-complete backticks", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});

			// Act
			await user.click(textarea);
			await user.keyboard("`");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("``");
		});

		it("should auto-complete double quotes", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});

			// Act
			await user.click(textarea);
			await user.keyboard('"');

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith('""');
		});

		it("should auto-complete single quotes", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			});

			// Act
			await user.click(textarea);
			await user.keyboard("'");

			// Assert
			expect(mockOnChange).toHaveBeenCalledWith("''");
		});
	});

	describe("Bracket Pair Deletion", () => {
		describe("Backspace key", () => {
			it("should delete both brackets when backspace is pressed between []", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="[]"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				// カーソルを括弧の間に配置
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should delete both brackets when backspace is pressed between ()", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="()"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should delete both brackets when backspace is pressed between {}", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="{}"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should delete both backticks when backspace is pressed between ``", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="``"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it('should delete both quotes when backspace is pressed between ""', async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value='""'
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should delete both quotes when backspace is pressed between ''", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="''"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should delete [[ and ]] when backspace is pressed between [[]]", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="[[]]"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				// カーソルを [[ と ]] の間に配置
				textarea.setSelectionRange(2, 2);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should perform normal backspace when not between bracket pairs", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="hello"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				// カーソルを最後に配置
				textarea.setSelectionRange(5, 5);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("hell");
			});

			it("should delete selection when backspace is pressed with selected text", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="hello world"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				// "world"を選択
				textarea.setSelectionRange(6, 11);
				textarea.focus();
				await user.keyboard("{Backspace}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("hello ");
			});
		});

		describe("Delete key", () => {
			it("should delete both brackets when delete is pressed between []", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="[]"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				// カーソルを括弧の間に配置
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Delete}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should delete both brackets when delete is pressed between ()", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="()"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				textarea.setSelectionRange(1, 1);
				textarea.focus();
				await user.keyboard("{Delete}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("");
			});

			it("should perform normal delete when not between bracket pairs", async () => {
				// Arrange
				const user = userEvent.setup();
				const mockOnChange = vi.fn();
				const mockSetValue = vi.fn();

				renderWithIntl(
					<CustomMarkdownEditor
						value="hello"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>,
				);

				const textarea = screen.getByRole("textbox", {
					name: /markdown editor/i,
				}) as HTMLTextAreaElement;

				// Act
				await user.click(textarea);
				// カーソルを最初に配置
				textarea.setSelectionRange(0, 0);
				textarea.focus();
				await user.keyboard("{Delete}");

				// Assert
				expect(mockOnChange).toHaveBeenCalledWith("ello");
			});
		});

		describe("Unix Keybindings", () => {
			describe("Ctrl+A (move to beginning of line)", () => {
				it("should move cursor to the beginning of the current line", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを中央に配置
					textarea.setSelectionRange(6, 6); // "Hello |World"
					textarea.focus();
					// Ctrl+A を押す
					await user.keyboard("{Control>}a{/Control}");

					// Assert
					expect(textarea.selectionStart).toBe(0);
					expect(textarea.selectionEnd).toBe(0);
				});

				// Note: Multi-line Ctrl+A test is skipped due to JSDOM limitations.
				// This functionality is tested in Storybook with real browser environment.
			});

			describe("Ctrl+E (move to end of line)", () => {
				it("should move cursor to the end of the current line", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを先頭に配置
					textarea.setSelectionRange(0, 0);
					textarea.focus();
					// Ctrl+E を押す
					await user.keyboard("{Control>}e{/Control}");

					// Assert
					expect(textarea.selectionStart).toBe(11);
					expect(textarea.selectionEnd).toBe(11);
				});

				// Note: Multi-line Ctrl+E test is skipped due to JSDOM limitations.
				// This functionality is tested in Storybook with real browser environment.
			});

			describe("Ctrl+B (move backward one character)", () => {
				it("should move cursor backward by one character", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを中央に配置
					textarea.setSelectionRange(6, 6); // "Hello |World"
					textarea.focus();
					// Ctrl+B を押す
					await user.keyboard("{Control>}b{/Control}");

					// Assert
					expect(textarea.selectionStart).toBe(5);
					expect(textarea.selectionEnd).toBe(5);
				});

				it("should not move cursor when at the beginning", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを先頭に配置
					textarea.setSelectionRange(0, 0);
					textarea.focus();
					// Ctrl+B を押す
					await user.keyboard("{Control>}b{/Control}");

					// Assert
					expect(textarea.selectionStart).toBe(0);
					expect(textarea.selectionEnd).toBe(0);
				});
			});

			describe("Ctrl+F (move forward one character)", () => {
				it("should move cursor forward by one character", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを先頭に配置
					textarea.setSelectionRange(0, 0);
					textarea.focus();
					// Ctrl+F を押す
					await user.keyboard("{Control>}f{/Control}");

					// Assert
					expect(textarea.selectionStart).toBe(1);
					expect(textarea.selectionEnd).toBe(1);
				});

				it("should not move cursor when at the end", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを末尾に配置
					textarea.setSelectionRange(11, 11);
					textarea.focus();
					// Ctrl+F を押す
					await user.keyboard("{Control>}f{/Control}");

					// Assert
					expect(textarea.selectionStart).toBe(11);
					expect(textarea.selectionEnd).toBe(11);
				});
			});
		});

		describe("List Auto-continuation", () => {
			describe("Bullet List", () => {
				it("should create a new bullet item when Enter is pressed with content", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- Hello"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを末尾に配置
					textarea.setSelectionRange(7, 7);
					textarea.focus();
					// Enter を押す
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("- Hello\n- ");
					expect(mockSetValue).toHaveBeenCalledWith("content", "- Hello\n- ");
				});

				it("should exit list when Enter is pressed on empty bullet item", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- "
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルを末尾に配置
					textarea.setSelectionRange(2, 2);
					textarea.focus();
					// Enter を押す
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("");
					expect(mockSetValue).toHaveBeenCalledWith("content", "");
				});

				it("should work with asterisk marker (*)", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="* Item"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(6, 6);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("* Item\n* ");
				});

				it("should work with plus marker (+)", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="+ Item"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(6, 6);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("+ Item\n+ ");
				});

				it("should preserve indentation", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="  - Indented"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(12, 12);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("  - Indented\n  - ");
				});
			});

			describe("Ordered List", () => {
				it("should create a new ordered item with incremented number", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="1. First"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(9, 9);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("1. First\n2. ");
				});

				it("should exit list when Enter is pressed on empty ordered item", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="1. "
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(3, 3);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("");
				});

				it("should preserve indentation with incremented number", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="  2. Second"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(12, 12);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("  2. Second\n  3. ");
				});
			});

			describe("Checkbox", () => {
				it("should create a new unchecked checkbox when Enter is pressed with content", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- [ ] Task"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(11, 11);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("- [ ] Task\n- [ ] ");
				});

				it("should create unchecked checkbox from checked checkbox", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- [x] Done"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(10, 10);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("- [x] Done\n- [ ] ");
				});

				it("should exit list when Enter is pressed on empty checkbox", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- [ ] "
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(6, 6);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("");
				});

				it("should work with asterisk marker (*)", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="* [ ] Task"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(11, 11);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("* [ ] Task\n* [ ] ");
				});

				it("should work with plus marker (+)", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="+ [x] Completed"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(15, 15);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("+ [x] Completed\n+ [ ] ");
				});
			});

			describe("Edge Cases", () => {
				it("should perform normal Enter when text is selected", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// テキストを選択
					textarea.setSelectionRange(2, 7);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert: リスト継続ではなく通常の改行が行われる
					// 選択範囲が削除され、改行が挿入される
					expect(mockOnChange).toHaveBeenCalledWith("- \n World");
				});

				it("should perform normal Enter when Shift is pressed", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="- Hello"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(7, 7);
					textarea.focus();
					await user.keyboard("{Shift>}{Enter}{/Shift}");

					// Assert: リスト継続ではなく通常の改行
					expect(mockOnChange).toHaveBeenCalledWith("- Hello\n");
				});

				it("should perform normal Enter on non-list line", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Regular text"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					textarea.setSelectionRange(7, 7);
					textarea.focus();
					await user.keyboard("{Enter}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("Regular\n text");
				});
			});
		});

		describe("Markdown Formatting", () => {
			describe("Bold (Cmd+B)", () => {
				it("should wrap selected text with ** when Cmd+B is pressed", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// "World"を選択
					textarea.setSelectionRange(6, 11);
					textarea.focus();
					// Cmd+B を押す
					await user.keyboard("{Meta>}b{/Meta}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("Hello **World**");
					expect(mockSetValue).toHaveBeenCalledWith(
						"content",
						"Hello **World**",
					);
				});

				it("should unwrap text when it is already bold", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello **World**"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// "World"を選択（**の間）
					textarea.setSelectionRange(8, 13);
					textarea.focus();
					// Cmd+B を押す
					await user.keyboard("{Meta>}b{/Meta}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("Hello World");
					expect(mockSetValue).toHaveBeenCalledWith("content", "Hello World");
				});

				it("should not apply bold when no text is selected", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルのみ配置（選択なし）
					textarea.setSelectionRange(5, 5);
					textarea.focus();
					// Cmd+B を押す
					await user.keyboard("{Meta>}b{/Meta}");

					// Assert: 変更されない
					expect(mockOnChange).not.toHaveBeenCalled();
				});
			});

			describe("Italic (Cmd+I)", () => {
				it("should wrap selected text with * when Cmd+I is pressed", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// "World"を選択
					textarea.setSelectionRange(6, 11);
					textarea.focus();
					// Cmd+I を押す
					await user.keyboard("{Meta>}i{/Meta}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("Hello *World*");
					expect(mockSetValue).toHaveBeenCalledWith("content", "Hello *World*");
				});

				it("should unwrap text when it is already italic", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello *World*"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// "World"を選択（*の間）
					textarea.setSelectionRange(7, 12);
					textarea.focus();
					// Cmd+I を押す
					await user.keyboard("{Meta>}i{/Meta}");

					// Assert
					expect(mockOnChange).toHaveBeenCalledWith("Hello World");
					expect(mockSetValue).toHaveBeenCalledWith("content", "Hello World");
				});

				it("should not apply italic when no text is selected", async () => {
					// Arrange
					const user = userEvent.setup();
					const mockOnChange = vi.fn();
					const mockSetValue = vi.fn();

					renderWithIntl(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>,
					);

					const textarea = screen.getByRole("textbox", {
						name: /markdown editor/i,
					}) as HTMLTextAreaElement;

					// Act
					await user.click(textarea);
					// カーソルのみ配置（選択なし）
					textarea.setSelectionRange(5, 5);
					textarea.focus();
					// Cmd+I を押す
					await user.keyboard("{Meta>}i{/Meta}");

					// Assert: 変更されない
					expect(mockOnChange).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe("Tag Detection", () => {
		it("should detect tag when # followed by text", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockSetValue = vi.fn();
			const mockOnTagDetection = vi.fn();

			function TestComponent() {
				const [value, setValue] = React.useState("");
				return (
					<CustomMarkdownEditor
						value={value}
						onChange={setValue}
						setValue={mockSetValue}
						onTagDetection={mockOnTagDetection}
					/>
				);
			}

			renderWithIntl(<TestComponent />);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			await user.type(textarea, "#tag");

			// Assert
			// タグ検知が呼ばれることを確認（detected: true, query: "tag"）
			expect(mockOnTagDetection).toHaveBeenCalledWith(true, "tag");
		});

		it("should not detect tag when only # is typed", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const mockOnTagDetection = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					onTagDetection={mockOnTagDetection}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			await user.type(textarea, "#");

			// Assert
			// #のみの場合はタグ検知されない（または detected: false）
			expect(mockOnTagDetection).toHaveBeenCalledWith(false, "");
		});

		it("should stop detecting tag when space is typed after tag", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const mockOnTagDetection = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					onTagDetection={mockOnTagDetection}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			await user.type(textarea, "#tag ");

			// Assert
			// スペース入力後はタグ検知が終了する（detected: false）
			expect(mockOnTagDetection).toHaveBeenLastCalledWith(false, "");
		});

		it("should not detect tag inside Wiki Link", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const mockOnTagDetection = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					onTagDetection={mockOnTagDetection}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			// Wiki Link内でタグを入力
			await user.type(textarea, "[[#tag");

			// Assert
			// Wiki Link内ではタグ検知されない
			expect(mockOnTagDetection).toHaveBeenCalledWith(false, "");
		});

		it("should detect tag outside Wiki Link", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockSetValue = vi.fn();
			const mockOnTagDetection = vi.fn();

			function TestComponent() {
				const [value, setValue] = React.useState("");
				return (
					<CustomMarkdownEditor
						value={value}
						onChange={setValue}
						setValue={mockSetValue}
						onTagDetection={mockOnTagDetection}
					/>
				);
			}

			renderWithIntl(<TestComponent />);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			// Wiki Link外でタグを入力
			await user.type(textarea, "[[article]] #tag");

			// Assert
			// Wiki Link外ではタグ検知される
			expect(mockOnTagDetection).toHaveBeenCalledWith(true, "tag");
		});

		it("should stop detecting tag after newline", async () => {
			// Arrange
			const user = userEvent.setup();
			const mockOnChange = vi.fn();
			const mockSetValue = vi.fn();
			const mockOnTagDetection = vi.fn();

			renderWithIntl(
				<CustomMarkdownEditor
					value=""
					onChange={mockOnChange}
					setValue={mockSetValue}
					onTagDetection={mockOnTagDetection}
				/>,
			);

			const textarea = screen.getByRole("textbox", {
				name: /markdown editor/i,
			}) as HTMLTextAreaElement;

			// Act
			await user.click(textarea);
			await user.type(textarea, "#tag{Enter}");

			// Assert
			// 改行後はタグ検知が終了する
			expect(mockOnTagDetection).toHaveBeenLastCalledWith(false, "");
		});
	});
});
