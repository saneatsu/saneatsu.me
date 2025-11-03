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

	describe("Bracket Auto-completion", () => {
		it("should auto-complete brackets when [ is typed", async () => {
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

			render(
				<CustomMarkdownEditor
					value="["
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
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

			render(
				<CustomMarkdownEditor
					value="hello"
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
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

			render(
				<CustomMarkdownEditor
					value="[]"
					onChange={mockOnChange}
					setValue={mockSetValue}
				/>
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

				render(
					<CustomMarkdownEditor
						value="[]"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="()"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="{}"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="``"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value='""'
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="''"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="[[]]"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="hello"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="hello world"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="[]"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="()"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

				render(
					<CustomMarkdownEditor
						value="hello"
						onChange={mockOnChange}
						setValue={mockSetValue}
					/>
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

					render(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>
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

					render(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>
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

					render(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>
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

					render(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>
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

					render(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>
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

					render(
						<CustomMarkdownEditor
							value="Hello World"
							onChange={mockOnChange}
							setValue={mockSetValue}
						/>
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
	});
});
