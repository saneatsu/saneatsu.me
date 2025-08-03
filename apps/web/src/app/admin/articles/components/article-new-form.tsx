"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor, { commands, type ICommand } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { CalendarIcon, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import {
	type SuggestionItem,
	useCheckSlug,
	useCreate,
} from "../../../../entities/article/api";
import { ArticleSuggestionsPopover } from "../../../../entities/article/ui";
import {
	type TagSuggestionItem,
	TagSuggestionsPopover,
} from "../../../../entities/tag/ui";
import { useDebounce } from "../../../../shared/hooks/use-debounce";
import { remarkTag } from "../../../../shared/lib/remark-tag";
import { remarkWikiLink } from "../../../../shared/lib/remark-wiki-link";
import { Button } from "../../../../shared/ui/button/button";
import { Input } from "../../../../shared/ui/input/input";
import { Label } from "../../../../shared/ui/label/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "../../../../shared/ui/radio-group/radio-group";

// Wiki Linkコンポーネントを動的インポート（クライアントサイドのみ）
const WikiLink = dynamic(
	() => import("../../../../shared/ui/wiki-link").then((mod) => mod.WikiLink),
	{ ssr: false }
);

/**
 * 記事作成フォームのスキーマ
 */
const articleNewSchema = z.object({
	title: z
		.string()
		.min(1, "タイトルは必須です")
		.max(200, "タイトルは200文字以内で入力してください"),
	slug: z
		.string()
		.min(1, "スラッグは必須です")
		.max(100, "スラッグは100文字以内で入力してください")
		.regex(
			/^[a-z0-9-]+$/,
			"スラッグは小文字の英数字とハイフンのみ使用できます"
		),
	content: z.string().min(1, "本文は必須です"),
	status: z.enum(["draft", "published"], {
		message: "ステータスを選択してください",
	}),
	publishedAt: z.string().optional(),
});

type ArticleNewForm = z.infer<typeof articleNewSchema>;

/**
 * 記事新規作成フォームコンポーネント
 *
 * @description
 * 記事を作成するためのフォーム。
 * 入力されたデータはバックエンドAPIに送信され、
 * 自動翻訳を実行して多言語記事として保存される。
 */
export function ArticleNewForm() {
	const [markdownValue, setMarkdownValue] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
	const [showTagSuggestions, setShowTagSuggestions] = useState(false);
	const [tagQuery, setTagQuery] = useState("");
	const [tagCursorPosition, setTagCursorPosition] = useState({
		top: 0,
		left: 0,
	});
	const editorRef = useRef<HTMLDivElement>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<ArticleNewForm>({
		resolver: zodResolver(articleNewSchema),
		defaultValues: {
			status: "draft",
		},
	});

	// スラッグの値を監視
	const slugValue = watch("slug");

	// スラッグをデバウンス（500ms遅延）
	const debouncedSlug = useDebounce(slugValue, 500);

	// 記事作成フック
	const createArticleMutation = useCreate();

	// スラッグ重複チェックフック
	const { data: slugCheckData, isLoading: slugChecking } = useCheckSlug({
		slug: debouncedSlug || "",
		queryConfig: {
			enabled: !!debouncedSlug && debouncedSlug.length > 0,
		},
	});

	// スラッグエラーの判定
	const slugError =
		slugCheckData && !slugCheckData.available
			? slugCheckData.message || "このスラッグは既に使用されています"
			: null;

	// カスタムboldコマンド（Cmd+Bを使用）
	const customBold: ICommand = {
		...commands.bold,
		shortcuts: "cmd+b", // macOSの標準的なBoldショートカット
	};

	// カスタムhrコマンド（Ctrl+Hを無効化）
	const customHr: ICommand = {
		...commands.hr,
		execute: () => {
			// 何もしない（デフォルトのhr挿入を防ぐ）
		},
	};

	// カスタムlinkコマンド（Ctrl+Kを無効化）
	const customLink: ICommand = {
		...commands.link,
		shortcuts: undefined, // ショートカットを無効化
	};

	// Wiki Link検知用のイベントリスナー
	useEffect(() => {
		let isComposing = false;

		const checkWikiLink = (_source: string) => {
			const textarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (!textarea) return;

			// textareaの値を直接使用
			const value = textarea.value;
			const cursorPos = textarea.selectionStart;

			// カーソル位置より前のテキストのみ処理
			const beforeCursor = value.substring(0, cursorPos);
			const afterCursor = value.substring(cursorPos);

			// [[の検出（最後の[[のみ）
			const lastBracketIndex = beforeCursor.lastIndexOf("[[");

			if (lastBracketIndex === -1) {
				// [[が見つからない場合は非表示
				if (showSuggestions) {
					setShowSuggestions(false);
				}
				return;
			}

			// [[以降のテキストを取得
			const afterBracket = value.substring(lastBracketIndex + 2, cursorPos);

			// ]]が含まれている場合は閉じられている
			if (afterBracket.includes("]]")) {
				if (showSuggestions) {
					setShowSuggestions(false);
				}
				return;
			}

			// カーソル後の最初の]]を探す
			const closingBracketIndex = afterCursor.indexOf("]]");

			// カーソルが[[]]の外にある場合（]]が見つからない、または]]より後に文字がある）
			if (closingBracketIndex === -1 || closingBracketIndex > 0) {
				if (showSuggestions) {
					setShowSuggestions(false);
				}
				return;
			}

			// サジェストを表示
			setSuggestionQuery(afterBracket);
			setShowSuggestions(true);

			// カーソル位置を計算（シンプル化）
			const rect = textarea.getBoundingClientRect();
			const lineHeight = 20;
			const charWidth = 8;

			// 改行数をカウント
			const lines = beforeCursor.split("\n").length;

			// 現在の行での[[の位置
			const lastLineStart = beforeCursor.lastIndexOf("\n") + 1;
			const currentLineText = beforeCursor.substring(lastLineStart);
			const bracketPosInLine = currentLineText.lastIndexOf("[[");

			setCursorPosition({
				top: rect.top + lines * lineHeight,
				left: rect.left + bracketPosInLine * charWidth,
			});
		};

		const handleInput = (_e: Event) => {
			if (!isComposing) {
				// 少し遅延して処理を実行（入力処理の競合を避ける）
				setTimeout(() => {
					checkWikiLink("input");
				}, 0);
			}
		};

		const handleCompositionStart = () => {
			isComposing = true;
		};

		const handleCompositionEnd = () => {
			isComposing = false;
			// IME確定後、MDEditorの内部処理を待ってからチェック
			setTimeout(() => {
				checkWikiLink("compositionend");
			}, 100);
		};

		const handleSelectionChange = () => {
			// カーソル位置が変更されたらチェック
			if (!isComposing) {
				checkWikiLink("selectionchange");
			}
		};

		// textareaにイベントリスナーを追加する関数
		const attachListeners = (textarea: HTMLTextAreaElement) => {
			textarea.addEventListener("input", handleInput);
			textarea.addEventListener("compositionstart", handleCompositionStart);
			textarea.addEventListener("compositionend", handleCompositionEnd);
			// selectionchangeはdocumentレベルで監視
			document.addEventListener("selectionchange", handleSelectionChange);
		};

		// textareaからイベントリスナーを削除する関数
		const detachListeners = (textarea: HTMLTextAreaElement) => {
			textarea.removeEventListener("input", handleInput);
			textarea.removeEventListener("compositionstart", handleCompositionStart);
			textarea.removeEventListener("compositionend", handleCompositionEnd);
			document.removeEventListener("selectionchange", handleSelectionChange);
		};

		// 初期のtextareaを探す
		const textarea = document.querySelector(
			".w-md-editor-text-input"
		) as HTMLTextAreaElement;

		if (textarea) {
			attachListeners(textarea);
		}

		// MutationObserverでtextareaの出現を監視
		const observer = new MutationObserver(() => {
			const newTextarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (newTextarea && !newTextarea.dataset.wikiLinkListener) {
				// 既存のリスナーをクリーンアップ
				const existingTextareas = document.querySelectorAll(
					".w-md-editor-text-input[data-wiki-link-listener]"
				);
				existingTextareas.forEach((ta) => {
					detachListeners(ta as HTMLTextAreaElement);
					delete (ta as HTMLTextAreaElement).dataset.wikiLinkListener;
				});

				newTextarea.dataset.wikiLinkListener = "true";
				attachListeners(newTextarea);
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			const currentTextarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (currentTextarea) {
				detachListeners(currentTextarea);
			}
			// documentレベルのイベントリスナーもクリーンアップ
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [showSuggestions]);

	// タグ検知用のイベントリスナー
	useEffect(() => {
		let isComposing = false;

		const checkTag = (_source: string) => {
			const textarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (!textarea) return;

			// textareaの値を直接使用
			const value = textarea.value;
			const cursorPos = textarea.selectionStart;

			// カーソル位置より前のテキストのみ処理
			const beforeCursor = value.substring(0, cursorPos);

			// #の検出（最後の#のみ）
			const lastHashIndex = beforeCursor.lastIndexOf("#");

			if (lastHashIndex === -1) {
				// #が見つからない場合は非表示
				if (showTagSuggestions) {
					setShowTagSuggestions(false);
				}
				return;
			}

			// #以降のテキストを取得
			const afterHash = value.substring(lastHashIndex + 1, cursorPos);

			// スペース、改行、または他の区切り文字が含まれている場合は閉じられている
			if (afterHash.match(/[\s\n\r\t]/)) {
				if (showTagSuggestions) {
					setShowTagSuggestions(false);
				}
				return;
			}

			// サジェストを表示
			setTagQuery(afterHash);
			setShowTagSuggestions(true);

			// カーソル位置を計算（シンプル化）
			const rect = textarea.getBoundingClientRect();
			const lineHeight = 20;
			const charWidth = 8;

			// 改行数をカウント
			const lines = beforeCursor.split("\n").length;

			// 現在の行での#の位置
			const lastLineStart = beforeCursor.lastIndexOf("\n") + 1;
			const currentLineText = beforeCursor.substring(lastLineStart);
			const hashPosInLine = currentLineText.lastIndexOf("#");

			setTagCursorPosition({
				top: rect.top + lines * lineHeight,
				left: rect.left + hashPosInLine * charWidth,
			});
		};

		const handleInput = (_e: Event) => {
			if (!isComposing) {
				// 少し遅延して処理を実行（入力処理の競合を避ける）
				setTimeout(() => {
					checkTag("input");
				}, 0);
			}
		};

		const handleCompositionStart = () => {
			isComposing = true;
		};

		const handleCompositionEnd = () => {
			isComposing = false;
			// IME確定後、MDEditorの内部処理を待ってからチェック
			setTimeout(() => {
				checkTag("compositionend");
			}, 100);
		};

		const handleSelectionChange = () => {
			// カーソル位置が変更されたらチェック
			if (!isComposing) {
				checkTag("selectionchange");
			}
		};

		// textareaにイベントリスナーを追加する関数
		const attachListeners = (textarea: HTMLTextAreaElement) => {
			textarea.addEventListener("input", handleInput);
			textarea.addEventListener("compositionstart", handleCompositionStart);
			textarea.addEventListener("compositionend", handleCompositionEnd);
			// selectionchangeはdocumentレベルで監視
			document.addEventListener("selectionchange", handleSelectionChange);
		};

		// textareaからイベントリスナーを削除する関数
		const detachListeners = (textarea: HTMLTextAreaElement) => {
			textarea.removeEventListener("input", handleInput);
			textarea.removeEventListener("compositionstart", handleCompositionStart);
			textarea.removeEventListener("compositionend", handleCompositionEnd);
			document.removeEventListener("selectionchange", handleSelectionChange);
		};

		// 初期のtextareaを探す
		const textarea = document.querySelector(
			".w-md-editor-text-input"
		) as HTMLTextAreaElement;

		if (textarea) {
			attachListeners(textarea);
		}

		// MutationObserverでtextareaの出現を監視
		const observer = new MutationObserver(() => {
			const newTextarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (newTextarea && !newTextarea.dataset.tagListener) {
				// 既存のリスナーをクリーンアップ
				const existingTextareas = document.querySelectorAll(
					".w-md-editor-text-input[data-tag-listener]"
				);
				existingTextareas.forEach((ta) => {
					detachListeners(ta as HTMLTextAreaElement);
					delete (ta as HTMLTextAreaElement).dataset.tagListener;
				});

				newTextarea.dataset.tagListener = "true";
				attachListeners(newTextarea);
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			const currentTextarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (currentTextarea) {
				detachListeners(currentTextarea);
			}
			// documentレベルのイベントリスナーもクリーンアップ
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [showTagSuggestions]);

	// MDEditorのクリック領域拡張処理
	useEffect(() => {
		const handleEditorClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;

			// MDEditorのコンテナ内がクリックされた場合
			const editorContainer = target.closest(".w-md-editor");
			if (!editorContainer) return;

			// テキストエリア自体がクリックされた場合は何もしない
			if (
				target.classList.contains("w-md-editor-text-input") ||
				target.tagName === "TEXTAREA"
			) {
				return;
			}

			// Popover関連の要素がクリックされた場合は何もしない
			if (
				target.closest('[role="option"]') ||
				target.closest(".fixed.z-50") ||
				target.closest("[data-suggestion-index]")
			) {
				return;
			}

			// プレビュー側の特定の要素（リンクなど）がクリックされた場合は何もしない
			if (target.tagName === "A" || target.closest("a")) {
				return;
			}

			// ツールバーのボタンがクリックされた場合は何もしない
			if (target.closest(".w-md-editor-toolbar")) {
				return;
			}

			// ドラッグバーがクリックされた場合は何もしない
			if (target.closest(".w-md-editor-split")) {
				return;
			}

			// スクロールバーがクリックされた場合は何もしない
			if (target.closest(".w-md-editor-text-container")) {
				const rect = (
					target.closest(".w-md-editor-text-container") as HTMLElement
				).getBoundingClientRect();
				const clickX = e.clientX;
				const clickY = e.clientY;

				// スクロールバー領域をクリックした場合は何もしない
				if (clickX > rect.right - 20 || clickY > rect.bottom - 20) {
					return;
				}
			}

			// テキストエリアを探してフォーカス
			const textarea = editorContainer.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (textarea) {
				// preventDefaultはテキストエリアに実際にフォーカスする場合のみ
				e.preventDefault();
				textarea.focus();

				// カーソルを最後に移動
				const length = textarea.value.length;
				textarea.setSelectionRange(length, length);
			}
		};

		// クリックイベントリスナーを追加
		document.addEventListener("click", handleEditorClick);

		return () => {
			document.removeEventListener("click", handleEditorClick);
		};
	}, []);

	// キーボードショートカットと括弧の自動補完処理
	useEffect(() => {
		// 括弧のペアを定義
		const bracketPairs: { [key: string]: string } = {
			"[": "]",
			"(": ")",
			"{": "}",
			"`": "`",
			'"': '"',
			"'": "'",
		};

		// 閉じ括弧の定義
		const closingBrackets = new Set(Object.values(bracketPairs));

		// 複数文字の括弧ペア（Wiki Link用）
		const multiCharBrackets = {
			"[[": "]]",
		};

		// 対応する括弧を探す関数
		const findMatchingBracket = (
			value: string,
			position: number,
			bracket: string,
			isClosing: boolean
		): number => {
			// 複数文字の括弧をチェック
			if (bracket === "[" || bracket === "]") {
				// [[]] のペアをチェック
				if (
					isClosing &&
					position >= 1 &&
					value.substring(position - 1, position + 1) === "]]"
				) {
					// ]] を削除する場合、対応する [[ を探す
					let depth = 1;
					for (let i = position - 2; i >= 0; i--) {
						if (i >= 1 && value.substring(i - 1, i + 1) === "]]") {
							depth++;
						} else if (i >= 1 && value.substring(i - 1, i + 1) === "[[") {
							depth--;
							if (depth === 0) {
								return i - 1; // [[ の開始位置
							}
						} else if (
							i === 0 &&
							i < value.length - 1 &&
							value.substring(i, i + 2) === "[["
						) {
							// i = 0 の場合の特別処理
							depth--;
							if (depth === 0) {
								return i; // [[ の開始位置
							}
						}
					}
				} else if (
					!isClosing &&
					position < value.length - 1 &&
					value.substring(position, position + 2) === "[["
				) {
					// [[ を削除する場合、対応する ]] を探す
					let depth = 1;
					for (let i = position + 2; i <= value.length - 2; i++) {
						if (i <= value.length - 2 && value.substring(i, i + 2) === "[[") {
							depth++;
						} else if (
							i <= value.length - 2 &&
							value.substring(i, i + 2) === "]]"
						) {
							depth--;
							if (depth === 0) {
								return i; // ]] の開始位置
							}
						}
					}
				}
			}

			// 単一文字の括弧をチェック
			const openBracket = isClosing
				? Object.keys(bracketPairs).find((key) => bracketPairs[key] === bracket)
				: bracket;
			const closeBracket = isClosing ? bracket : bracketPairs[bracket];

			if (!openBracket || !closeBracket) return -1;

			if (isClosing) {
				// 閉じ括弧から開き括弧を探す
				let depth = 1;
				for (let i = position - 1; i >= 0; i--) {
					if (value[i] === closeBracket) {
						depth++;
					} else if (value[i] === openBracket) {
						depth--;
						if (depth === 0) {
							return i;
						}
					}
				}
			} else {
				// 開き括弧から閉じ括弧を探す
				let depth = 1;
				for (let i = position + 1; i < value.length; i++) {
					if (value[i] === openBracket) {
						depth++;
					} else if (value[i] === closeBracket) {
						depth--;
						if (depth === 0) {
							return i;
						}
					}
				}
			}

			return -1;
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const textarea = document.querySelector(
				".w-md-editor-text-input"
			) as HTMLTextAreaElement;
			if (!textarea || document.activeElement !== textarea) return;

			// Ctrl+K または Cmd+K を無効化（カタカナ変換のため）
			if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
				e.stopPropagation(); // MDEditorのデフォルト動作を防ぐ
				return; // ブラウザのデフォルト動作は維持
			}

			// Cmd+L を無効化
			if (e.metaKey && (e.key === "l" || e.key === "L")) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			// Cmd+B でBoldフォーマット
			if (
				e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				(e.key === "b" || e.key === "B")
			) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がある場合のみBoldフォーマットを適用
				if (start !== end) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();

					const selectedText = value.substring(start, end);
					const beforeText = value.substring(0, start);
					const afterText = value.substring(end);

					// **で囲まれているかチェック
					const isBold =
						beforeText.endsWith("**") && afterText.startsWith("**");

					let newValue;
					let newStart, newEnd;

					if (isBold) {
						// Bold解除
						newValue =
							beforeText.slice(0, -2) + selectedText + afterText.slice(2);
						newStart = start - 2;
						newEnd = end - 2;
					} else {
						// Bold適用
						newValue = `${beforeText}**${selectedText}**${afterText}`;
						newStart = start + 2;
						newEnd = end + 2;
					}

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(newStart, newEnd);
						textarea.focus();
					}, 0);
				}
				return;
			}

			// Unixキーバインドの実装
			if (e.ctrlKey && !e.metaKey && !e.altKey) {
				// Ctrl+B: カーソルを左へ移動
				if (e.key === "b" || e.key === "B") {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();

					const cursorPos = textarea.selectionStart;
					if (cursorPos > 0) {
						textarea.setSelectionRange(cursorPos - 1, cursorPos - 1);
					}
					return;
				}

				// Ctrl+F: カーソルを右へ移動
				if (e.key === "f" || e.key === "F") {
					e.preventDefault();
					e.stopPropagation();

					const cursorPos = textarea.selectionStart;
					if (cursorPos < textarea.value.length) {
						textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
					}
					return;
				}
			}

			// 括弧の自動補完処理
			// 開き括弧が入力された場合
			if (bracketPairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
				e.preventDefault();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;
				const selectedText = value.substring(start, end);

				// [[ の場合は [[]] に補完
				if (e.key === "[" && start > 0 && value.charAt(start - 1) === "[") {
					// カーソルの直後に ] がある場合は削除する（[] の中で [ を押した場合）
					let endPos = end;
					if (value.charAt(end) === "]") {
						endPos = end + 1;
					}

					const newValue =
						value.slice(0, start) +
						"[" +
						selectedText +
						"]]" +
						value.slice(endPos);
					const newCursorPos = start + 1 + selectedText.length;

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						if (selectedText) {
							// テキストが選択されていた場合は、そのテキストを選択状態にする
							textarea.setSelectionRange(
								start + 1,
								start + 1 + selectedText.length
							);
						} else {
							// テキストが選択されていない場合は、括弧の間にカーソルを配置
							textarea.setSelectionRange(newCursorPos, newCursorPos);
						}
						textarea.focus();
					}, 0);
				} else {
					// 通常の括弧補完
					const closingBracket = bracketPairs[e.key];
					const newValue =
						value.slice(0, start) +
						e.key +
						selectedText +
						closingBracket +
						value.slice(end);
					const newCursorPos = start + 1 + selectedText.length;

					setMarkdownValue(newValue);
					setValue("content", newValue);

					setTimeout(() => {
						textarea.value = newValue;
						if (selectedText) {
							// テキストが選択されていた場合は、そのテキストを選択状態にする
							textarea.setSelectionRange(
								start + 1,
								start + 1 + selectedText.length
							);
						} else {
							// テキストが選択されていない場合は、括弧の間にカーソルを配置
							textarea.setSelectionRange(newCursorPos, newCursorPos);
						}
						textarea.focus();
					}, 0);
				}
				return;
			}

			// 閉じ括弧のスキップ処理
			if (closingBrackets.has(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const value = textarea.value;

				// カーソルの直後が同じ閉じ括弧の場合はスキップ
				if (start < value.length && value.charAt(start) === e.key) {
					e.preventDefault();
					textarea.setSelectionRange(start + 1, start + 1);
					return;
				}
			}

			// バックスペースでのペア削除処理
			if (e.key === "Backspace" && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がない場合のみペア削除を考慮
				if (start === end && start > 0) {
					const charBefore = value.charAt(start - 1);
					const charAfter = value.charAt(start);

					// まず、カーソルが括弧ペアの間にある場合の処理
					if (
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 1) + value.slice(start + 1);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 1, start - 1);
							textarea.focus();
						}, 0);
						return;
					}

					// [[]] の間にカーソルがある場合
					if (
						start >= 2 &&
						value.substring(start - 2, start) === "[[" &&
						value.substring(start, start + 2) === "]]"
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 2) + value.slice(start + 2);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 2, start - 2);
							textarea.focus();
						}, 0);
						return;
					}

					// 削除される文字が括弧の場合、対応するペアも削除
					// ] を削除する場合
					if (charBefore === "]") {
						// ]] の一部かチェック
						if (start >= 2 && value.charAt(start - 2) === "]") {
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"]",
								true
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
								// カーソル位置を計算：削除前の位置から削除された文字数を引く
								// 外側の括弧ペア（2文字）が削除されるので、元の位置から1を引く
								const newCursorPos = start - 1;

									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start - 1) +
									value.slice(start);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の ] を削除
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"]",
								true
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start - 1) +
									value.slice(start);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								// カーソル位置を計算：削除された文字数を考慮
								// 開き括弧が削除されるので、元のカーソル位置から2文字分戻る
								const newCursorPos = start - 2;

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// その他の閉じ括弧を削除する場合
					else if (closingBrackets.has(charBefore)) {
						const matchingPos = findMatchingBracket(
							value,
							start - 1,
							charBefore,
							true
						);
						if (matchingPos !== -1) {
							e.preventDefault();
							const newValue =
								value.slice(0, matchingPos) +
								value.slice(matchingPos + 1, start - 1) +
								value.slice(start);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							// カーソル位置を計算：削除された文字数を考慮
							// 開き括弧が削除されるので、元のカーソル位置から2文字分戻る
							const newCursorPos = start - 2;

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(newCursorPos, newCursorPos);
								textarea.focus();
							}, 0);
							return;
						}
					}
					// [ を削除する場合
					else if (charBefore === "[") {
						// [[ の一部かチェック
						if (start >= 2 && value.charAt(start - 2) === "[") {
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"[",
								false
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
								// カーソル位置を計算：削除前の位置から削除された文字数を引く
								// 外側の括弧ペア（2文字）が削除されるので、元の位置から1を引く
								const newCursorPos = start - 1;

									value.slice(0, start - 1) +
									value.slice(start, matchingPos) +
									value.slice(matchingPos + 1);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の [ を削除
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"[",
								false
							);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, start - 1) +
									value.slice(start, matchingPos) +
									value.slice(matchingPos + 1);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(start - 1, start - 1);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// その他の開き括弧を削除する場合
					else if (bracketPairs[charBefore]) {
						const matchingPos = findMatchingBracket(
							value,
							start - 1,
							charBefore,
							false
						);
						if (matchingPos !== -1) {
							e.preventDefault();
							const newValue =
								value.slice(0, start - 1) +
								value.slice(start, matchingPos) +
								value.slice(matchingPos + 1);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(start - 1, start - 1);
								textarea.focus();
							}, 0);
							return;
						}
					}
				}
			}

			// Ctrl+H または Cmd+H を検知
			if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
				e.preventDefault();
				e.stopPropagation();

				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				if (start === end && start > 0) {
					const charBefore = value.charAt(start - 1);
					const charAfter = value.charAt(start);

					// まず、カーソルが括弧ペアの間にある場合の処理
					if (
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
						const newValue = value.slice(0, start - 1) + value.slice(start + 1);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 1, start - 1);
							textarea.focus();
						}, 0);
						return;
					}

					// [[]] の間にカーソルがある場合
					if (
						start >= 2 &&
						value.substring(start - 2, start) === "[[" &&
						value.substring(start, start + 2) === "]]"
					) {
						const newValue = value.slice(0, start - 2) + value.slice(start + 2);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 2, start - 2);
							textarea.focus();
						}, 0);
						return;
					}

					// 削除される文字が括弧の場合、対応するペアも削除
					// ] を削除する場合
					if (charBefore === "]") {
						// ]] の一部かチェック
						if (start >= 2 && value.charAt(start - 2) === "]") {
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"]",
								true
							);
							if (matchingPos !== -1) {
								const newValue =
								// カーソル位置を計算：削除前の位置から削除された文字数を引く
								// 外側の括弧ペア（2文字）が削除されるので、元の位置から1を引く
								const newCursorPos = start - 1;

									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start - 1) +
									value.slice(start);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の ] を削除
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"]",
								true
							);
							if (matchingPos !== -1) {
								const newValue =
									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start - 1) +
									value.slice(start);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								// カーソル位置を計算：削除された文字数を考慮
								// 開き括弧が削除されるので、元のカーソル位置から2文字分戻る
								const newCursorPos = start - 2;

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// その他の閉じ括弧を削除する場合
					else if (closingBrackets.has(charBefore)) {
						const matchingPos = findMatchingBracket(
							value,
							start - 1,
							charBefore,
							true
						);
						if (matchingPos !== -1) {
							const newValue =
								value.slice(0, matchingPos) +
								value.slice(matchingPos + 1, start - 1) +
								value.slice(start);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							// カーソル位置を計算：削除された文字数を考慮
							// 開き括弧が削除されるので、元のカーソル位置から2文字分戻る
							const newCursorPos = start - 2;

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(newCursorPos, newCursorPos);
								textarea.focus();
							}, 0);
							return;
						}
					}
					// [ を削除する場合
					else if (charBefore === "[") {
						// [[ の一部かチェック
						if (start >= 2 && value.charAt(start - 2) === "[") {
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"[",
								false
							);
							if (matchingPos !== -1) {
								const newValue =
								// カーソル位置を計算：削除前の位置から削除された文字数を引く
								// 外側の括弧ペア（2文字）が削除されるので、元の位置から1を引く
								const newCursorPos = start - 1;

									value.slice(0, start - 1) +
									value.slice(start, matchingPos) +
									value.slice(matchingPos + 1);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(newCursorPos, newCursorPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の [ を削除
							const matchingPos = findMatchingBracket(
								value,
								start - 1,
								"[",
								false
							);
							if (matchingPos !== -1) {
								const newValue =
									value.slice(0, start - 1) +
									value.slice(start, matchingPos) +
									value.slice(matchingPos + 1);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(start - 1, start - 1);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// その他の開き括弧を削除する場合
					else if (bracketPairs[charBefore]) {
						const matchingPos = findMatchingBracket(
							value,
							start - 1,
							charBefore,
							false
						);
						if (matchingPos !== -1) {
							const newValue =
								value.slice(0, start - 1) +
								value.slice(start, matchingPos) +
								value.slice(matchingPos + 1);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(start - 1, start - 1);
								textarea.focus();
							}, 0);
							return;
						}
					}

					// 通常の削除処理（括弧ペアでない場合）
					const newValue = value.slice(0, start - 1) + value.slice(start);

					// 値を更新
					setMarkdownValue(newValue);
					setValue("content", newValue);

					// textareaの値も更新してカーソル位置を設定
					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start - 1, start - 1);
						textarea.focus();
					}, 0);
				} else if (start !== end) {
					// 選択範囲を削除
					const newValue = value.slice(0, start) + value.slice(end);

					// 値を更新
					setMarkdownValue(newValue);
					setValue("content", newValue);

					// textareaの値も更新してカーソル位置を設定
					setTimeout(() => {
						textarea.value = newValue;
						textarea.setSelectionRange(start, start);
						textarea.focus();
					}, 0);
				}
			}

			// Delete キーでのペア削除処理
			if (e.key === "Delete" && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const value = textarea.value;

				// 選択範囲がない場合のみペア削除を考慮
				if (start === end && start < value.length) {
					const charAfter = value.charAt(start);
					const charBefore = value.charAt(start - 1);

					// カーソルが括弧ペアの間にある場合の処理
					if (
						start > 0 &&
						bracketPairs[charBefore] &&
						bracketPairs[charBefore] === charAfter
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 1) + value.slice(start + 1);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 1, start - 1);
							textarea.focus();
						}, 0);
						return;
					}

					// [[]] の間にカーソルがある場合
					if (
						start >= 2 &&
						value.substring(start - 2, start) === "[[" &&
						value.substring(start, start + 2) === "]]"
					) {
						e.preventDefault();
						const newValue = value.slice(0, start - 2) + value.slice(start + 2);

						setMarkdownValue(newValue);
						setValue("content", newValue);

						setTimeout(() => {
							textarea.value = newValue;
							textarea.setSelectionRange(start - 2, start - 2);
							textarea.focus();
						}, 0);
						return;
					}

					// 削除される文字が括弧の場合、対応するペアも削除
					// [ を削除する場合
					if (charAfter === "[") {
						// [[ の一部かチェック
						if (start < value.length - 1 && value.charAt(start + 1) === "[") {
							const matchingPos = findMatchingBracket(value, start, "[", false);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, start) +
									value.slice(start + 2, matchingPos) +
									value.slice(matchingPos + 2);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(start, start);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の [ を削除
							const matchingPos = findMatchingBracket(value, start, "[", false);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, start) +
									value.slice(start + 1, matchingPos) +
									value.slice(matchingPos + 1);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(start, start);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// ] を削除する場合
					else if (charAfter === "]") {
						// ]] の一部かチェック
						if (start < value.length - 1 && value.charAt(start + 1) === "]") {
							const matchingPos = findMatchingBracket(value, start, "]", true);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, matchingPos) +
									value.slice(matchingPos + 2, start) +
									value.slice(start + 2);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(matchingPos, matchingPos);
									textarea.focus();
								}, 0);
								return;
							}
						} else {
							// 単一の ] を削除
							const matchingPos = findMatchingBracket(value, start, "]", true);
							if (matchingPos !== -1) {
								e.preventDefault();
								const newValue =
									value.slice(0, matchingPos) +
									value.slice(matchingPos + 1, start) +
									value.slice(start + 1);

								setMarkdownValue(newValue);
								setValue("content", newValue);

								setTimeout(() => {
									textarea.value = newValue;
									textarea.setSelectionRange(matchingPos, matchingPos);
									textarea.focus();
								}, 0);
								return;
							}
						}
					}
					// その他の開き括弧を削除する場合
					else if (bracketPairs[charAfter]) {
						const matchingPos = findMatchingBracket(
							value,
							start,
							charAfter,
							false
						);
						if (matchingPos !== -1) {
							e.preventDefault();
							const newValue =
								value.slice(0, start) +
								value.slice(start + 1, matchingPos) +
								value.slice(matchingPos + 1);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(start, start);
								textarea.focus();
							}, 0);
							return;
						}
					}
					// その他の閉じ括弧を削除する場合
					else if (closingBrackets.has(charAfter)) {
						const matchingPos = findMatchingBracket(
							value,
							start,
							charAfter,
							true
						);
						if (matchingPos !== -1) {
							e.preventDefault();
							const newValue =
								value.slice(0, matchingPos) +
								value.slice(matchingPos + 1, start) +
								value.slice(start + 1);

							setMarkdownValue(newValue);
							setValue("content", newValue);

							setTimeout(() => {
								textarea.value = newValue;
								textarea.setSelectionRange(matchingPos, matchingPos);
								textarea.focus();
							}, 0);
							return;
						}
					}
				}
			}
		};

		// キャプチャフェーズで処理
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [setValue]);

	// カスタムコマンドリスト（bold、hr、linkを置き換え）
	const customCommands = [
		customBold, // カスタムboldコマンドを使用（Cmd+Bに変更）
		commands.italic,
		commands.strikethrough,
		commands.code,
		customLink, // カスタムlinkコマンドを使用（Ctrl+K無効化）
		commands.quote,
		commands.codeBlock,
		commands.comment,
		commands.image,
		commands.table,
		customHr, // カスタムhrコマンドを使用
		commands.checkedListCommand,
		commands.orderedListCommand,
		commands.unorderedListCommand,
	];

	/**
	 * フォーム送信処理
	 */
	const onSubmit = async (data: ArticleNewForm) => {
		// スラッグエラーがある場合は送信しない
		if (slugError) {
			alert("スラッグにエラーがあります。修正してから送信してください。");
			return;
		}

		try {
			// 公開日時の処理
			let publishedAt: string | undefined;
			if (data.status === "published" && data.publishedAt) {
				// datetime-localの値をISO文字列に変換
				publishedAt = new Date(data.publishedAt).toISOString();
			}

			// APIに送信
			const response = await createArticleMutation.mutateAsync({
				title: data.title,
				slug: data.slug,
				content: data.content,
				status: data.status,
				publishedAt,
			});

			console.log("記事作成成功:", response);
			alert(`記事「${response.data.title}」が作成されました！`);

			// TODO: 記事一覧ページにリダイレクト
			// router.push("/admin/articles");
		} catch (error) {
			console.error("記事作成エラー:", error);
			const errorMessage =
				error instanceof Error ? error.message : "記事の作成に失敗しました";
			alert(`記事の作成に失敗しました: ${errorMessage}`);
		}
	};

	/**
	 * Wiki Linkサジェスト選択時の処理
	 */
	const handleSuggestionSelect = (suggestion: SuggestionItem) => {
		// 現在のカーソル位置から[[を検索
		const textarea = editorRef.current?.querySelector(
			"textarea"
		) as HTMLTextAreaElement;
		if (!textarea) return;

		const cursorPos = textarea.selectionStart;
		const beforeCursor = markdownValue.substring(0, cursorPos);
		const afterCursor = markdownValue.substring(cursorPos);

		// [[の開始位置を検索
		const startIndex = beforeCursor.lastIndexOf("[[");
		if (startIndex === -1) return;

		// カーソル後のテキストが]]で始まる場合はスキップ
		let adjustedAfterCursor = afterCursor;
		if (afterCursor.startsWith("]]")) {
			adjustedAfterCursor = afterCursor.substring(2);
		}

		// リンクテキストを生成（見出しの場合は#付き）
		let linkText: string;
		if (suggestion.type === "heading") {
			// 見出しの場合は [[slug#見出しタイトル]] 形式
			linkText = `[[${suggestion.slug}#${suggestion.title}]]`;
		} else {
			// 記事の場合は [[slug]] 形式
			linkText = `[[${suggestion.slug}]]`;
		}

		// 新しいコンテンツを構築
		const newContent =
			markdownValue.substring(0, startIndex) + linkText + adjustedAfterCursor;

		// 新しいカーソル位置を計算
		const newCursorPos = startIndex + linkText.length;

		setMarkdownValue(newContent);
		setValue("content", newContent);
		setShowSuggestions(false);
		setSuggestionQuery("");

		// フォーカスをMDEditorのテキストエリアに戻す
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	/**
	 * タグサジェスト選択時の処理
	 */
	const handleTagSelect = (tag: TagSuggestionItem) => {
		// 現在のカーソル位置から#を検索
		const textarea = editorRef.current?.querySelector(
			"textarea"
		) as HTMLTextAreaElement;
		if (!textarea) return;

		const cursorPos = textarea.selectionStart;
		const beforeCursor = markdownValue.substring(0, cursorPos);
		const afterCursor = markdownValue.substring(cursorPos);

		// #の開始位置を検索
		const startIndex = beforeCursor.lastIndexOf("#");
		if (startIndex === -1) return;

		// 新しいコンテンツを構築（タグの後にスペースを追加）
		const newContent =
			markdownValue.substring(0, startIndex) + `#${tag.name} ` + afterCursor;

		// 新しいカーソル位置を計算
		const newCursorPos = startIndex + `#${tag.name} `.length;

		setMarkdownValue(newContent);
		setValue("content", newContent);
		setShowTagSuggestions(false);
		setTagQuery("");

		// フォーカスをMDEditorのテキストエリアに戻す
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	/**
	 * MDEditorの変更処理
	 */
	const handleEditorChange = (val: string | undefined) => {
		const value = val || "";
		setMarkdownValue(value);
		setValue("content", value);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
			{/* タイトル */}
			<div className="space-y-2">
				<Label htmlFor="title" className="required">
					タイトル
				</Label>
				<Input
					id="title"
					{...register("title")}
					placeholder="記事のタイトルを入力してください"
					className={errors.title ? "border-destructive" : ""}
				/>
				{errors.title && (
					<p className="text-sm text-destructive">{errors.title.message}</p>
				)}
			</div>

			{/* スラッグ */}
			<div className="space-y-2">
				<Label htmlFor="slug" className="required">
					スラッグ
					{slugChecking && (
						<span className="ml-2 text-sm text-muted-foreground">
							確認中...
						</span>
					)}
				</Label>
				<div className="relative">
					<Input
						id="slug"
						{...register("slug")}
						placeholder="url-friendly-slug"
						className={
							errors.slug || slugError
								? "border-destructive"
								: slugChecking
									? "border-blue-300"
									: ""
						}
					/>
					{slugChecking && (
						<Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
					)}
				</div>
				{errors.slug && (
					<p className="text-sm text-destructive">{errors.slug.message}</p>
				)}
				{slugError && <p className="text-sm text-destructive">{slugError}</p>}
				{!errors.slug && !slugError && debouncedSlug && !slugChecking && (
					<p className="text-sm text-green-600">✓ このスラッグは利用可能です</p>
				)}
				<p className="text-sm text-muted-foreground">
					記事のURLに使用されます（小文字の英数字とハイフンのみ）
				</p>
			</div>

			{/* ステータス */}
			<div className="space-y-2">
				<Label className="required">公開ステータス</Label>
				<RadioGroup
					defaultValue="draft"
					onValueChange={(value) =>
						setValue("status", value as "draft" | "published")
					}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="draft" id="draft" />
						<Label htmlFor="draft">下書き</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="published" id="published" />
						<Label htmlFor="published">公開</Label>
					</div>
				</RadioGroup>
				{errors.status && (
					<p className="text-sm text-destructive">{errors.status.message}</p>
				)}
			</div>

			{/* 公開日時（公開時のみ表示） */}
			{watch("status") === "published" && (
				<div className="space-y-2">
					<Label htmlFor="publishedAt">公開日時</Label>
					<div className="relative">
						<Input
							id="publishedAt"
							type="datetime-local"
							{...register("publishedAt")}
						/>
						<CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
					</div>
				</div>
			)}

			{/* 記事内容 */}
			<div className="space-y-2">
				<Label htmlFor="content" className="required">
					本文（Markdown形式）
				</Label>
				<div
					ref={editorRef}
					className={
						errors.content ? "border border-destructive rounded-md" : ""
					}
				>
					<MDEditor
						value={markdownValue}
						onChange={handleEditorChange}
						commands={customCommands}
						preview="live"
						visibleDragbar={true}
						data-color-mode="light"
						height={500}
						previewOptions={{
							remarkPlugins: [[remarkGfm], [remarkWikiLink], [remarkTag]],
							components: {
								a: ({ children, href, ...props }: any) => {
									// Wiki Linkの判定
									const className = props.className as string;
									const isWikiLink = className?.includes("wiki-link");

									// Wiki Linkの場合はカスタムコンポーネントを使用
									if (isWikiLink && href) {
										return (
											<WikiLink
												href={href}
												language="ja"
												className={className}
												{...props}
											>
												{children}
											</WikiLink>
										);
									}

									// 通常のリンク
									return (
										<a href={href} className="underline" {...props}>
											{children}
										</a>
									);
								},
							},
						}}
					/>
				</div>
				{errors.content && (
					<p className="text-sm text-destructive">{errors.content.message}</p>
				)}
				<p className="text-sm text-muted-foreground">
					日本語で入力してください。保存時に自動的に他の言語に翻訳されます。Ctrl+Shift+P（Mac:
					Cmd+Shift+P）でプレビューモードを切り替えできます。[[で他の記事へのリンクを挿入できます。
				</p>
			</div>

			{/* 送信ボタン */}
			<div className="flex justify-end space-x-4">
				<Button type="button" variant="outline">
					キャンセル
				</Button>
				<Button type="submit" disabled={createArticleMutation.isPending}>
					{createArticleMutation.isPending && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					{createArticleMutation.isPending ? "作成中..." : "記事を作成"}
				</Button>
			</div>

			{/* Wiki Linkサジェストポップアップ */}
			<ArticleSuggestionsPopover
				open={showSuggestions}
				onOpenChange={setShowSuggestions}
				query={suggestionQuery}
				language="ja"
				onSelect={handleSuggestionSelect}
				position={cursorPosition}
			/>

			{/* タグサジェストポップアップ */}
			<TagSuggestionsPopover
				open={showTagSuggestions}
				onOpenChange={setShowTagSuggestions}
				query={tagQuery}
				onSelect={handleTagSelect}
				position={tagCursorPosition}
			/>
		</form>
	);
}
