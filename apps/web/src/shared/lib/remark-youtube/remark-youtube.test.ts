import { describe, expect, it } from "vitest";

import {
	extractYouTubeTimestamp,
	extractYouTubeVideoId,
} from "./remark-youtube";

describe("Unit Test", () => {
	describe("extractYouTubeVideoId", () => {
		it("youtube.com/watch?v=形式からビデオIDを抽出できる", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			const result = extractYouTubeVideoId(url);
			expect(result).toBe("dQw4w9WgXcQ");
		});

		it("youtube.com/watch?v=形式（複数パラメータ）からビデオIDを抽出できる", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=123s";
			const result = extractYouTubeVideoId(url);
			expect(result).toBe("dQw4w9WgXcQ");
		});

		it("youtu.be/形式からビデオIDを抽出できる", () => {
			const url = "https://youtu.be/dQw4w9WgXcQ";
			const result = extractYouTubeVideoId(url);
			expect(result).toBe("dQw4w9WgXcQ");
		});

		it("youtube.com/embed/形式からビデオIDを抽出できる", () => {
			const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
			const result = extractYouTubeVideoId(url);
			expect(result).toBe("dQw4w9WgXcQ");
		});

		it("youtube.com/v/形式からビデオIDを抽出できる", () => {
			const url = "https://www.youtube.com/v/dQw4w9WgXcQ";
			const result = extractYouTubeVideoId(url);
			expect(result).toBe("dQw4w9WgXcQ");
		});

		it("YouTube以外のURLの場合nullを返す", () => {
			const url = "https://example.com/video";
			const result = extractYouTubeVideoId(url);
			expect(result).toBeNull();
		});

		it("無効なYouTube URLの場合nullを返す", () => {
			const url = "https://www.youtube.com/invalid";
			const result = extractYouTubeVideoId(url);
			expect(result).toBeNull();
		});
	});

	describe("extractYouTubeTimestamp", () => {
		it("&t=123s形式からタイムスタンプを抽出できる", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=123s";
			const result = extractYouTubeTimestamp(url);
			expect(result).toBe(123);
		});

		it("&t=123形式（秒なし）からタイムスタンプを抽出できる", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=123";
			const result = extractYouTubeTimestamp(url);
			expect(result).toBe(123);
		});

		it("?t=123形式からタイムスタンプを抽出できる", () => {
			const url = "https://youtu.be/dQw4w9WgXcQ?t=123";
			const result = extractYouTubeTimestamp(url);
			expect(result).toBe(123);
		});

		it("#t=123形式からタイムスタンプを抽出できる", () => {
			const url = "https://youtu.be/dQw4w9WgXcQ#t=123";
			const result = extractYouTubeTimestamp(url);
			expect(result).toBe(123);
		});

		it("&start=123形式からタイムスタンプを抽出できる", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=123";
			const result = extractYouTubeTimestamp(url);
			expect(result).toBe(123);
		});

		it("タイムスタンプがない場合undefinedを返す", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			const result = extractYouTubeTimestamp(url);
			expect(result).toBeUndefined();
		});
	});
});
