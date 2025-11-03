import { type RefObject, useEffect } from "react";

/**
 * タグ検知フックの設定
 */
interface TagDetectionConfig {
	/** テキストエリアのref */
	textareaRef: RefObject<HTMLTextAreaElement>;
	/** タグ検知時のコールバック */
	onTagDetection?: (detected: boolean, query: string) => void;
}

/**
 * タグ検知フック
 *
 * @description
 * textareaでのタグ記法（#tag）を検知するフック。
 * 以下の機能を含む：
 * - #の後にテキストがある場合にタグ検知
 * - Wiki Link内（[[...]]）でのタグ検知除外
 * - スペースや改行でタグ検知終了
 * - #のみの場合は検知しない
 */
export function useTagDetection({
	textareaRef,
	onTagDetection,
}: TagDetectionConfig) {
	useEffect(() => {
		/**
		 * タグ検知処理
		 *
		 * 1. カーソル位置より前のテキストから #を検索
		 * 2. Wiki Link内かどうかをチェック
		 * 3. #の後のテキストを取得
		 * 4. スペースや改行が含まれていないかチェック
		 * 5. 空のクエリ（#のみ）の場合は検知しない
		 * 6. onTagDetectionコールバックを呼ぶ
		 */
		const checkTagDetection = () => {
			const textarea = textareaRef.current;
			if (!textarea) return;

			const value = textarea.value;
			const cursorPos = textarea.selectionStart;

			// カーソル位置より前のテキストのみ処理
			const beforeCursor = value.substring(0, cursorPos);

			// Wiki Link内にいるかチェック
			const lastWikiLinkStart = beforeCursor.lastIndexOf("[[");
			if (lastWikiLinkStart !== -1) {
				// [[の後のテキストを取得
				const afterWikiLinkStart = value.substring(lastWikiLinkStart);
				// ]]の位置を探す
				const wikiLinkEnd = afterWikiLinkStart.indexOf("]]");

				if (wikiLinkEnd !== -1) {
					// Wiki Link全体の終了位置（2つ目の]の位置）
					const wikiLinkEndAbsolute = lastWikiLinkStart + wikiLinkEnd + 1;

					// カーソルがWiki Link内にある場合（]]の間も含む）
					if (
						cursorPos >= lastWikiLinkStart &&
						cursorPos <= wikiLinkEndAbsolute
					) {
						// Wiki Link内にカーソルがある場合はタグ検知を終了
						onTagDetection?.(false, "");
						return;
					}
				}
			}

			// #の検出（最後の#のみ）
			const lastHashIndex = beforeCursor.lastIndexOf("#");

			if (lastHashIndex === -1) {
				// #が見つからない場合は非表示
				onTagDetection?.(false, "");
				return;
			}

			// #以降のテキストを取得
			const afterHash = value.substring(lastHashIndex + 1, cursorPos);

			// スペース、改行、または他の区切り文字が含まれている場合は閉じられている
			if (afterHash.match(/[\s\n\r\t]/)) {
				onTagDetection?.(false, "");
				return;
			}

			// 空のクエリ（#のみ）の場合はタグ検知しない
			if (afterHash.length === 0) {
				onTagDetection?.(false, "");
				return;
			}

			// タグ検知成功
			onTagDetection?.(true, afterHash);
		};

		const handleInput = () => {
			// 入力ごとにタグ検知
			checkTagDetection();
		};

		const handleSelectionChange = () => {
			// カーソル移動時もタグ検知
			const textarea = textareaRef.current;
			if (textarea && document.activeElement === textarea) {
				checkTagDetection();
			}
		};

		const textarea = textareaRef.current;
		if (!textarea) return;

		// イベントリスナーを追加
		textarea.addEventListener("input", handleInput);
		document.addEventListener("selectionchange", handleSelectionChange);

		return () => {
			textarea.removeEventListener("input", handleInput);
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [textareaRef, onTagDetection]);
}
