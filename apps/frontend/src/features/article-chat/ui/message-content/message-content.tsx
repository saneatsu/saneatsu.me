import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";

interface MessageContentProps {
	/** Markdownコンテンツ文字列 */
	content: string;
	/** ストリーミング中かどうか（Streamdownのアニメーション制御に使用） */
	isStreaming?: boolean;
}

/**
 * AI応答のMarkdownコンテンツをレンダリングするコンポーネント。
 * streamdownを使用してMarkdown（見出し、リスト、コードブロック等）を適切に表示する。
 * ストリーミング開始直後（コンテンツ未到着時）はタイピングインジケーターを表示する。
 */
export function MessageContent({
	content,
	isStreaming = false,
}: MessageContentProps) {
	// ストリーミング中かつコンテンツが空の場合、タイピングインジケーターを表示
	if (isStreaming && content === "") {
		return (
			<div className="flex items-center gap-1 py-1">
				<span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
				<span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.15s]" />
				<span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.3s]" />
			</div>
		);
	}

	return (
		<div className="prose prose-sm dark:prose-invert prose-ul:my-0 prose-ol:my-0 prose-li:my-0 max-w-full break-words overflow-hidden">
			<Streamdown
				plugins={{ code }}
				isAnimating={isStreaming}
				linkSafety={{ enabled: false }}
				components={{
					a: ({ children, href, ...props }) => (
						<a {...props} href={href} target="_blank" rel="noopener noreferrer">
							{children}
						</a>
					),
				}}
			>
				{content}
			</Streamdown>
		</div>
	);
}
