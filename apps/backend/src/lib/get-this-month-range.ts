/** JST（Asia/Tokyo）のUTCからのオフセット（ミリ秒）。DSTが無いため固定値で扱える */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 「今月」の期間をJST基準で算出する。
 *
 * @description
 * ダッシュボードの「今月の新規記事数」などをJST（日本時間）の月境界で集計するために使う。
 * DBの `created_at` はアプリ側で `new Date().toISOString()`（UTCのISO 8601文字列）として
 * 保存されるため、返す境界値も同じISO 8601文字列（UTC）で返し、そのまま文字列比較
 * （gte / lt）に使えるようにしている。
 *
 * Cloudflare Workers のランタイムは常にUTCで動作するため、`now` のローカルタイムゾーンに
 * 依存せず、明示的に+9時間してJSTの年月を求めている。
 *
 * 1. `now` に+9時間してJST上の日時を作り、その年・月を取得する
 * 2. JSTの「当月1日 0時0分0秒」をUTCの瞬間に戻す（-9時間）
 * 3. 同様にJSTの「翌月1日 0時0分0秒」を上限（排他）として算出する
 *
 * @param now - 基準となる現在時刻（UTCのDate）
 * @returns 当月の開始（含む）と翌月の開始（含まない）をUTCのISO 8601文字列で返す
 */
export function getThisMonthRangeJst(now: Date): {
	start: string;
	end: string;
} {
	// 1. JST上での年・月を求める
	const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
	const jstYear = jstNow.getUTCFullYear();
	const jstMonth = jstNow.getUTCMonth();

	// 2. JSTの当月1日0時をUTCの瞬間に変換
	const start = new Date(Date.UTC(jstYear, jstMonth, 1) - JST_OFFSET_MS);

	// 3. JSTの翌月1日0時をUTCの瞬間に変換（排他上限）。月が12を超える場合もDate.UTCが年を繰り上げる
	const end = new Date(Date.UTC(jstYear, jstMonth + 1, 1) - JST_OFFSET_MS);

	return {
		start: start.toISOString(),
		end: end.toISOString(),
	};
}
