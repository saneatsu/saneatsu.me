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
 */
export function MessageContent({
	content,
	isStreaming = false,
}: MessageContentProps) {
	return (
		<div className="prose prose-sm dark:prose-invert prose-ul:my-0 prose-ol:my-0 prose-li:my-0 max-w-full break-words overflow-hidden">
			<Streamdown
				plugins={{ code }}
				isAnimating={isStreaming}
				linkSafety={{ enabled: false }}
			>
				{content}
			</Streamdown>
		</div>
	);
}
