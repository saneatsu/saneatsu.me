"use client";

import { ArrowUp, Bot, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { Button, Textarea } from "@/shared/ui";

import { useArticleChat } from "../../api/use-article-chat/use-article-chat";

interface ArticleChatPanelProps {
	/** 記事のMarkdownコンテンツ */
	articleContent: string;
	/** パネルを閉じるコールバック */
	onClose: () => void;
}

/**
 * 記事AIチャットパネルコンポーネント
 *
 * @description
 * 記事の内容について質問できるインラインチャットパネル。
 *
 * 1. クイックアクションボタン（要約）の表示
 * 2. メッセージ履歴のスクロール表示
 * 3. テキスト入力と送信
 * 4. ストリーミング中のアニメーション表示
 */
export function ArticleChatPanel({
	articleContent,
	onClose,
}: ArticleChatPanelProps) {
	const t = useTranslations("articleChat");
	const { messages, isLoading, error, sendMessage } = useArticleChat({
		articleContent,
	});
	const [inputValue, setInputValue] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	/** テキストエリアの高さを内容に合わせて自動調整する（最大10行） */
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, []);

	const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value);
		adjustTextareaHeight();
	};

	// メッセージが追加・更新されるたびに末尾にスクロール
	const lastMessage = messages[messages.length - 1];
	const lastMessageId = lastMessage?.id;
	const lastMessageContentLength = lastMessage?.content?.length ?? 0;
	useEffect(() => {
		// lastMessageContentLength を参照してストリーミング中の更新でもスクロールする
		if (lastMessageId && lastMessageContentLength >= 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [lastMessageId, lastMessageContentLength]);

	const handleSubmit = async () => {
		if (!inputValue.trim() || isLoading) return;
		const message = inputValue;
		setInputValue("");
		// 送信後にテキストエリアの高さをリセット
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
		await sendMessage(message);
	};

	const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			await handleSubmit();
		}
	};

	return (
		<div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
			{/* ヘッダー */}
			<div className="flex items-center justify-between p-3 border-b bg-muted/30">
				<div className="flex items-center gap-2">
					<Bot className="h-4 w-4 text-primary" />
					<span className="text-sm font-medium">{t("title")}</span>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={onClose}
					aria-label={t("close")}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* メッセージ履歴 */}
			<div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
				{/* メッセージ一覧 */}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
								message.role === "user"
									? "bg-primary text-primary-foreground"
									: "bg-muted"
							}`}
						>
							{message.content}
							{message.isStreaming && (
								<span className="inline-block w-1 h-3 ml-0.5 bg-current animate-pulse rounded-full" />
							)}
						</div>
					</div>
				))}

				{/* エラー表示 */}
				{error && (
					<div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
						{error}
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* 入力エリア */}
			<div className="p-3 border-t">
				<div className="relative">
					<Textarea
						ref={textareaRef}
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder={t("inputPlaceholder")}
						className="min-h-[40px] max-h-[240px] pr-10 text-sm resize-none overflow-y-auto"
						rows={1}
						disabled={isLoading}
						aria-label={t("inputLabel")}
					/>
					<Button
						type="button"
						size="icon"
						className="absolute right-1.5 bottom-1.5 h-7 w-7 rounded-md"
						onClick={handleSubmit}
						disabled={isLoading || !inputValue.trim()}
						aria-label={t("send")}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
				</div>
				<p className="text-xs text-muted-foreground mt-1.5">{t("hint")}</p>
			</div>
		</div>
	);
}
