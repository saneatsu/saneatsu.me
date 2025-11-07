import type { Area } from "react-easy-crop";

/**
 * Canvas APIを使用して画像をクロップする
 *
 * @param imageSrc - クロップする画像のURL（blob URLまたはhttp(s) URL）
 * @param pixelCrop - クロップ範囲のピクセル座標
 * @param rotation - 回転角度（度数法、デフォルト: 0）
 * @returns クロップされた画像のBlob
 *
 * @description
 * この関数は以下の処理を行う:
 * 1. 画像を読み込む
 * 2. Canvasに描画
 * 3. 指定された範囲で切り取り
 * 4. Blobとして返す
 */
export async function getCroppedImg(
	imageSrc: string,
	pixelCrop: Area,
	rotation = 0
): Promise<Blob> {
	// 1. 画像を読み込む
	const image = await createImage(imageSrc);

	// 2. Canvasを作成
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Canvas context not supported");
	}

	// 3. 回転を考慮した画像サイズを計算
	const maxSize = Math.max(image.width, image.height);
	const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

	// 4. Canvasのサイズを設定（安全な領域を確保）
	canvas.width = safeArea;
	canvas.height = safeArea;

	// 5. Canvasの中心に移動して回転
	ctx.translate(safeArea / 2, safeArea / 2);
	ctx.rotate((rotation * Math.PI) / 180);
	ctx.translate(-safeArea / 2, -safeArea / 2);

	// 6. 画像を描画
	ctx.drawImage(
		image,
		safeArea / 2 - image.width * 0.5,
		safeArea / 2 - image.height * 0.5
	);

	// 7. クロップ範囲を抽出
	const data = ctx.getImageData(0, 0, safeArea, safeArea);

	// 8. Canvasサイズをクロップ範囲に合わせる
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	// 9. クロップした部分を描画
	ctx.putImageData(
		data,
		Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
		Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
	);

	// 10. Blobとして返す
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error("Canvas is empty"));
				return;
			}
			resolve(blob);
		}, "image/jpeg");
	});
}

/**
 * URLから画像を読み込む
 *
 * @param url - 画像のURL
 * @returns 読み込まれた画像のHTMLImageElement
 */
function createImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", (error) => reject(error));
		image.setAttribute("crossOrigin", "anonymous"); // CORS対応
		image.src = url;
	});
}
