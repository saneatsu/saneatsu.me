"use client";

import { ArrowUp, Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import {
	Button,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useChatPanelPortal,
} from "@/shared/ui";

import { useArticleChat } from "../../api/use-article-chat/use-article-chat";
import { MessageContent } from "../message-content/message-content";

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
	const { onExpandChat, onCollapseChat, isChatExpanded } = useChatPanelPortal();
	const { messages, isLoading, error, sendMessage } = useArticleChat({
		articleContent,
	});
	const [inputValue, setInputValue] = useState("");
	const scrollContainerRef = useRef<HTMLDivElement>(null);
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
		// scrollIntoViewは祖先スクロールコンテナも巻き込むため使用しない
		if (
			lastMessageId &&
			lastMessageContentLength >= 0 &&
			scrollContainerRef.current
		) {
			scrollContainerRef.current.scrollTop =
				scrollContainerRef.current.scrollHeight;
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
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			await handleSubmit();
		}
	};

	/** navigator.platformでMac環境かどうかを判定する */
	const isMac =
		typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

	return (
		<div className="flex flex-col h-full bg-card overflow-hidden">
			{/* ヘッダー: サイトヘッダーと同じ構造（外側にborder-b、内側にh-14）で横線の高さを揃える */}
			<div className="border-b bg-muted/30">
				<div className="flex items-center justify-between h-14 px-3">
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-primary" />
						<span className="text-sm font-medium">{t("title")}</span>
					</div>
					<div className="flex items-center gap-0.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={isChatExpanded ? onCollapseChat : onExpandChat}
									aria-label={t(isChatExpanded ? "collapse" : "expand")}
								>
									{isChatExpanded ? (
										<Minimize2 className="h-4 w-4" />
									) : (
										<Maximize2 className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t(isChatExpanded ? "collapse" : "expand")}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
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
							</TooltipTrigger>
							<TooltipContent side="bottom">{t("close")}</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>

			{/* メッセージ履歴: overscroll-containでスクロールチェイニングを防止し、記事本文への伝播を防ぐ */}
			<div
				ref={scrollContainerRef}
				role="log"
				className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3 min-h-0"
			>
				{/* メッセージ一覧 */}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
								message.role === "user"
									? "whitespace-pre-wrap bg-primary text-primary-foreground"
									: "bg-muted"
							}`}
						>
							{message.role === "assistant" ? (
								<MessageContent
									content={message.content}
									isStreaming={message.isStreaming}
								/>
							) : (
								message.content
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
				<p className="text-xs text-muted-foreground mt-1.5">
					{t(isMac ? "hint.mac" : "hint.win")}
				</p>
			</div>
		</div>
	);
}
