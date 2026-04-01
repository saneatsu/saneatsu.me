import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

// vitest.setup.mtsのグローバルモックを解除して実際の翻訳プロバイダーを使う
vi.unmock("next-intl");

import { ArticleChatPanel } from "./article-chat-panel";

// --- モック ---
const { mockSendMessage } = vi.hoisted(() => ({
	mockSendMessage: vi.fn(),
}));

vi.mock("../../api/use-article-chat/use-article-chat", () => ({
	useArticleChat: () => ({
		messages: [],
		isLoading: false,
		error: null,
		sendMessage: mockSendMessage,
		clearMessages: vi.fn(),
	}),
}));

// --- 翻訳メッセージ ---
const messages = {
	articleChat: {
		title: "記事について質問",
		close: "チャットを閉じる",
		description: "この記事の内容について質問できます",
		openChat: "記事について質問",
		inputPlaceholder: "質問を入力してください",
		inputLabel: "質問入力",
		send: "送信",
		hint: {
			mac: "⌘+Enterで送信",
			win: "Ctrl+Enterで送信",
		},
		quickAction: {
			summarize: "この記事の内容を要約してください",
			summarizeLabel: "記事を要約する",
		},
		error: {
			fetchFailed: "回答の取得に失敗しました。もう一度お試しください",
			unknown: "予期しないエラーが発生しました。もう一度お試しください",
		},
	},
};

/** テスト用のラッパーコンポーネント */
function renderPanel() {
	return render(
		<NextIntlClientProvider locale="ja" messages={messages}>
			<ArticleChatPanel articleContent="テスト記事" onClose={vi.fn()} />
		</NextIntlClientProvider>
	);
}

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ArticleChatPanel", () => {
	describe("Unit Test", () => {
		describe("送信キーの動作", () => {
			it("Enter単体では送信されない（改行として扱われる）", async () => {
				// Given: テキストエリアに入力がある状態
				renderPanel();
				const textarea = screen.getByRole("textbox", { name: "質問入力" });
				await userEvent.type(textarea, "テストメッセージ");

				// When: Enterキーを押す
				await userEvent.type(textarea, "{Enter}");

				// Then: sendMessageが呼ばれない
				expect(mockSendMessage).not.toHaveBeenCalled();
			});

			it("Shift+Enterでは送信されない（改行として扱われる）", async () => {
				// Given: テキストエリアに入力がある状態
				renderPanel();
				const textarea = screen.getByRole("textbox", { name: "質問入力" });
				await userEvent.type(textarea, "テストメッセージ");

				// When: Shift+Enterを押す
				await userEvent.type(textarea, "{Shift>}{Enter}{/Shift}");

				// Then: sendMessageが呼ばれない
				expect(mockSendMessage).not.toHaveBeenCalled();
			});

			it("Meta+Enterで送信される（Mac）", async () => {
				// Given: テキストエリアに入力がある状態
				renderPanel();
				const textarea = screen.getByRole("textbox", { name: "質問入力" });
				await userEvent.type(textarea, "テストメッセージ");

				// When: Meta+Enterを押す
				await userEvent.type(textarea, "{Meta>}{Enter}{/Meta}");

				// Then: sendMessageが呼ばれる
				expect(mockSendMessage).toHaveBeenCalledWith("テストメッセージ");
			});

			it("Ctrl+Enterで送信される（Windows）", async () => {
				// Given: テキストエリアに入力がある状態
				renderPanel();
				const textarea = screen.getByRole("textbox", { name: "質問入力" });
				await userEvent.type(textarea, "テストメッセージ");

				// When: Ctrl+Enterを押す
				await userEvent.type(textarea, "{Control>}{Enter}{/Control}");

				// Then: sendMessageが呼ばれる
				expect(mockSendMessage).toHaveBeenCalledWith("テストメッセージ");
			});

			it("空入力でMeta+Enterを押しても送信されない", async () => {
				// Given: テキストエリアが空の状態
				renderPanel();
				const textarea = screen.getByRole("textbox", { name: "質問入力" });

				// When: Meta+Enterを押す
				await userEvent.type(textarea, "{Meta>}{Enter}{/Meta}");

				// Then: sendMessageが呼ばれない
				expect(mockSendMessage).not.toHaveBeenCalled();
			});
		});

		describe("スクロールの独立性", () => {
			it("メッセージ領域のスクロールが記事本文に伝播しない（overscroll-contain）", () => {
				// Given: チャットパネルをレンダリング
				renderPanel();

				// When: メッセージ履歴のログ領域を取得
				const messageLog = screen.getByRole("log");

				// Then: overscroll-containクラスが適用されている
				expect(messageLog.className).toContain("overscroll-contain");
			});
		});

		describe("ヒントテキストの表示", () => {
			it("Mac環境では「⌘+Enterで送信」と表示される", () => {
				// Given: Mac環境
				vi.stubGlobal("navigator", {
					...navigator,
					platform: "MacIntel",
				});

				// When: パネルをレンダリング
				renderPanel();

				// Then: Macのヒントが表示される
				expect(screen.getByText("⌘+Enterで送信")).toBeInTheDocument();

				vi.unstubAllGlobals();
			});

			it("Windows環境では「Ctrl+Enterで送信」と表示される", () => {
				// Given: Windows環境
				vi.stubGlobal("navigator", {
					...navigator,
					platform: "Win32",
				});

				// When: パネルをレンダリング
				renderPanel();

				// Then: Windowsのヒントが表示される
				expect(screen.getByText("Ctrl+Enterで送信")).toBeInTheDocument();

				vi.unstubAllGlobals();
			});
		});
	});
});
