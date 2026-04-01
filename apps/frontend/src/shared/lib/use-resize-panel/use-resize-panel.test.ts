import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useResizePanel } from "./use-resize-panel";

/**
 * startResizeに渡すモックMouseEventを生成する
 */
function createMockMouseEvent(clientX: number) {
	return {
		clientX,
		preventDefault: vi.fn(),
	} as unknown as React.MouseEvent;
}

describe("useResizePanel", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe("Unit Test", () => {
		describe("初期状態", () => {
			it("defaultWidthで初期化される", () => {
				// Given: defaultWidth=350で初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 350 })
				);

				// Then: widthが350である
				expect(result.current.width).toBe(350);
				expect(result.current.isResizing).toBe(false);
			});
		});

		describe("最小幅制約", () => {
			it("minWidth未満にリサイズできない", () => {
				// Given: minWidth=280でフックを初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 350, minWidth: 280 })
				);

				// When: ドラッグを開始し、minWidth未満にリサイズを試みる
				act(() => {
					result.current.startResize(createMockMouseEvent(350));
				});

				// マウスを大幅に右に移動（パネル左端基準で幅が小さくなる方向）
				act(() => {
					document.dispatchEvent(
						new MouseEvent("mousemove", { clientX: 350 + 200 })
					);
				});

				// rAFコールバックを実行
				act(() => {
					vi.advanceTimersByTime(16);
				});

				// Then: 幅がminWidth（280）を下回らない
				expect(result.current.width).toBeGreaterThanOrEqual(280);

				// クリーンアップ
				act(() => {
					document.dispatchEvent(new MouseEvent("mouseup"));
				});
			});

			it("デフォルトのminWidthが280である", () => {
				// Given: minWidthを指定せずに初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 350 })
				);

				// When: ドラッグを開始し、280未満にリサイズを試みる
				act(() => {
					result.current.startResize(createMockMouseEvent(350));
				});

				act(() => {
					document.dispatchEvent(
						new MouseEvent("mousemove", { clientX: 350 + 200 })
					);
				});

				act(() => {
					vi.advanceTimersByTime(16);
				});

				// Then: 幅がデフォルトminWidth（280）を下回らない
				expect(result.current.width).toBeGreaterThanOrEqual(280);

				// クリーンアップ
				act(() => {
					document.dispatchEvent(new MouseEvent("mouseup"));
				});
			});
		});

		describe("最大幅制約", () => {
			it("maxWidth超にリサイズできない", () => {
				// Given: maxWidth=600でフックを初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 350, maxWidth: 600 })
				);

				// When: ドラッグを開始し、maxWidth超にリサイズを試みる
				act(() => {
					result.current.startResize(createMockMouseEvent(350));
				});

				// マウスを大幅に左に移動（パネルの幅が大きくなる方向）
				act(() => {
					document.dispatchEvent(
						new MouseEvent("mousemove", { clientX: 350 - 400 })
					);
				});

				act(() => {
					vi.advanceTimersByTime(16);
				});

				// Then: 幅がmaxWidth（600）を超えない
				expect(result.current.width).toBeLessThanOrEqual(600);

				// クリーンアップ
				act(() => {
					document.dispatchEvent(new MouseEvent("mouseup"));
				});
			});
		});

		describe("カーソルスタイル", () => {
			it("通常時はcursor-ew-resizeを返す", () => {
				// Given: 中間幅で初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 400, minWidth: 280, maxWidth: 600 })
				);

				// Then: 通常のリサイズカーソル
				expect(result.current.cursorStyle).toBe("cursor-ew-resize");
			});

			it("最小幅のときcursor-w-resizeを返す", () => {
				// Given: minWidthと同じ幅で初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 280, minWidth: 280, maxWidth: 600 })
				);

				// Then: 左方向（縮小不可）のカーソル
				expect(result.current.cursorStyle).toBe("cursor-w-resize");
			});

			it("最大幅のときcursor-e-resizeを返す", () => {
				// Given: maxWidthと同じ幅で初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 600, minWidth: 280, maxWidth: 600 })
				);

				// Then: 右方向（拡大不可）のカーソル
				expect(result.current.cursorStyle).toBe("cursor-e-resize");
			});
		});

		describe("ドラッグ中フラグ", () => {
			it("mousedown時にisResizingがtrueになり、mouseup時にfalseになる", () => {
				// Given: フックを初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 350 })
				);

				// When: ドラッグ開始
				act(() => {
					result.current.startResize(createMockMouseEvent(350));
				});

				// Then: isResizingがtrue
				expect(result.current.isResizing).toBe(true);

				// When: ドラッグ終了
				act(() => {
					document.dispatchEvent(new MouseEvent("mouseup"));
				});

				// Then: isResizingがfalse
				expect(result.current.isResizing).toBe(false);
			});
		});

		describe("ドラッグ中のテキスト選択防止", () => {
			it("ドラッグ中はuserSelectがnoneになり、終了後に復元される", () => {
				// Given: フックを初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 350 })
				);

				const originalUserSelect = document.body.style.userSelect;

				// When: ドラッグ開始
				act(() => {
					result.current.startResize(createMockMouseEvent(350));
				});

				// Then: userSelectがnone
				expect(document.body.style.userSelect).toBe("none");

				// When: ドラッグ終了
				act(() => {
					document.dispatchEvent(new MouseEvent("mouseup"));
				});

				// Then: userSelectが復元される
				expect(document.body.style.userSelect).toBe(originalUserSelect);
			});
		});

		describe("クリーンアップ", () => {
			it("アンマウント時にイベントリスナーが解除される", () => {
				// Given: ドラッグ中のフック
				const { result, unmount } = renderHook(() =>
					useResizePanel({ defaultWidth: 350 })
				);

				const removeEventListenerSpy = vi.spyOn(
					document,
					"removeEventListener"
				);

				// When: ドラッグ開始後にアンマウント
				act(() => {
					result.current.startResize(createMockMouseEvent(350));
				});

				unmount();

				// Then: mousemoveとmouseupのイベントリスナーが解除される
				const removedEvents = removeEventListenerSpy.mock.calls.map(
					(call) => call[0]
				);
				expect(removedEvents).toContain("mousemove");
				expect(removedEvents).toContain("mouseup");

				removeEventListenerSpy.mockRestore();
			});
		});

		describe("リサイズ動作", () => {
			it("ドラッグでパネル幅が変更される", () => {
				// Given: defaultWidth=400で初期化
				const { result } = renderHook(() =>
					useResizePanel({ defaultWidth: 400, minWidth: 280, maxWidth: 600 })
				);

				// When: ドラッグを開始し、マウスを左に50px移動（パネルが右端にあるため、左に動かすと幅が増える）
				act(() => {
					result.current.startResize(createMockMouseEvent(400));
				});

				act(() => {
					document.dispatchEvent(
						new MouseEvent("mousemove", { clientX: 400 - 50 })
					);
				});

				act(() => {
					vi.advanceTimersByTime(16);
				});

				// Then: 幅が50px増えている
				expect(result.current.width).toBe(450);

				// クリーンアップ
				act(() => {
					document.dispatchEvent(new MouseEvent("mouseup"));
				});
			});
		});
	});
});
