import type { ICommand } from "@uiw/react-md-editor";

import type { ImageUploadResult } from "../use-image-upload/use-image-upload";

/**
 * 画像アップロードコマンドを作成
 *
 * @description
 * MDEditorで使用する画像アップロードコマンドを生成する。
 *
 * 機能：
 * 1. ツールバーに画像アップロードボタンを追加
 * 2. クリックでファイル選択ダイアログを開く
 * 3. 選択された画像をアップロード
 * 4. Markdown形式でエディタに挿入
 *
 * @param uploadImage - 画像アップロード関数
 * @returns MDEditor用のICommandオブジェクト
 *
 * @example
 * ```tsx
 * const { uploadImage } = useImageUpload();
 * const uploadCommand = createImageUploadCommand(uploadImage);
 *
 * <MDEditor
 *   commands={[...otherCommands, uploadCommand]}
 * />
 * ```
 */
export function createImageUploadCommand(
	uploadImage: (file: File) => Promise<ImageUploadResult | null>
): ICommand {
	return {
		name: "upload-image",
		keyCommand: "upload-image",
		buttonProps: { "aria-label": "画像をアップロード" },
		icon: (
			<svg width="12" height="12" viewBox="0 0 20 20">
				<title>画像をアップロード</title>
				<path
					fill="currentColor"
					d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
				/>
			</svg>
		),
		execute: (_state, api) => {
			// ファイル選択ダイアログを開く
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/jpeg,image/png,image/gif,image/webp";
			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;

				// ファイルサイズチェック（10MB）
				const maxSize = 10 * 1024 * 1024; // 10MB
				if (file.size > maxSize) {
					alert("ファイルサイズは10MB以下にしてください");
					return;
				}

				// 画像をアップロード
				const result = await uploadImage(file);
				if (result) {
					// カーソル位置に画像のMarkdownを挿入
					api.replaceSelection(result.markdown);
				}
			};
			input.click();
		},
	};
}
