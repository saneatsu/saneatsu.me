import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUnsavedChangesAlert } from "./use-unsaved-changes-alert";

describe("useUnsavedChangesAlert", () => {
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let pushStateSpy: ReturnType<typeof vi.spyOn>;
	let goSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		addEventListenerSpy = vi.spyOn(window, "addEventListener");
		removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
		pushStateSpy = vi.spyOn(window.history, "pushState");
		goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});
	});

	afterEach(() => {
		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
		pushStateSpy.mockRestore();
		goSpy.mockRestore();
	});

	describe("Unit Test", () => {
		describe("guardNavigation", () => {
			it("isDirty=false のときナビゲーション関数が即座に実行される", () => {
				// Given: isDirty=false のフック
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: false })
				);
				const navigateFn = vi.fn();

				// When: guardNavigation を呼ぶ
				act(() => {
					result.current.guardNavigation(navigateFn);
				});

				// Then: ナビゲーション関数が即座に実行される
				expect(navigateFn).toHaveBeenCalledTimes(1);
				expect(result.current.showDialog).toBe(false);
			});

			it("isDirty=true のときダイアログが表示される", () => {
				// Given: isDirty=true のフック
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);
				const navigateFn = vi.fn();

				// When: guardNavigation を呼ぶ
				act(() => {
					result.current.guardNavigation(navigateFn);
				});

				// Then: ダイアログが表示され、ナビゲーション関数は実行されない
				expect(result.current.showDialog).toBe(true);
				expect(navigateFn).not.toHaveBeenCalled();
			});

			it("enabled=false のとき isDirty=true でもナビゲーション関数が即座に実行される", () => {
				// Given: isDirty=true, enabled=false のフック
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true, enabled: false })
				);
				const navigateFn = vi.fn();

				// When: guardNavigation を呼ぶ
				act(() => {
					result.current.guardNavigation(navigateFn);
				});

				// Then: ナビゲーション関数が即座に実行される
				expect(navigateFn).toHaveBeenCalledTimes(1);
				expect(result.current.showDialog).toBe(false);
			});

			it("undefined を渡してもエラーにならない", () => {
				// Given: isDirty=false のフック
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: false })
				);

				// When/Then: undefined を渡してもエラーにならない
				expect(() => {
					act(() => {
						result.current.guardNavigation(undefined as unknown as () => void);
					});
				}).not.toThrow();
			});
		});

		describe("handleConfirm", () => {
			it("保留中のナビゲーション関数が実行され、ダイアログが閉じる", () => {
				// Given: isDirty=true でダイアログが表示されている状態
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);
				const navigateFn = vi.fn();

				act(() => {
					result.current.guardNavigation(navigateFn);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm を呼ぶ
				act(() => {
					result.current.handleConfirm();
				});

				// Then: 保留中のナビゲーション関数が実行され、ダイアログが閉じる
				expect(navigateFn).toHaveBeenCalledTimes(1);
				expect(result.current.showDialog).toBe(false);
			});

			it("保留中のナビゲーションがない状態で呼んでもエラーにならない", () => {
				// Given: 保留中のナビゲーションがない状態
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				// When/Then: handleConfirm を呼んでもエラーにならない
				expect(() => {
					act(() => {
						result.current.handleConfirm();
					});
				}).not.toThrow();
				expect(result.current.showDialog).toBe(false);
			});
		});

		describe("handleCancel", () => {
			it("ナビゲーション関数を実行せずにダイアログが閉じる", () => {
				// Given: isDirty=true でダイアログが表示されている状態
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);
				const navigateFn = vi.fn();

				act(() => {
					result.current.guardNavigation(navigateFn);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleCancel を呼ぶ
				act(() => {
					result.current.handleCancel();
				});

				// Then: ナビゲーション関数は実行されず、ダイアログが閉じる
				expect(navigateFn).not.toHaveBeenCalled();
				expect(result.current.showDialog).toBe(false);
			});
		});

		describe("beforeunload イベント", () => {
			it("isDirty=true のとき beforeunload リスナーが登録される", () => {
				// Given/When: isDirty=true でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: true }));

				// Then: beforeunload イベントリスナーが登録される
				const beforeunloadCalls = addEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "beforeunload"
				);
				expect(beforeunloadCalls.length).toBeGreaterThan(0);
			});

			it("isDirty=false のとき beforeunload リスナーが登録されない", () => {
				// Given/When: isDirty=false でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: false }));

				// Then: beforeunload イベントリスナーが登録されない
				const beforeunloadCalls = addEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "beforeunload"
				);
				expect(beforeunloadCalls.length).toBe(0);
			});

			it("enabled=false のとき beforeunload リスナーが登録されない", () => {
				// Given/When: isDirty=true, enabled=false でフックをレンダリング
				renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true, enabled: false })
				);

				// Then: beforeunload イベントリスナーが登録されない
				const beforeunloadCalls = addEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "beforeunload"
				);
				expect(beforeunloadCalls.length).toBe(0);
			});

			it("beforeunload 発火時に preventDefault が呼ばれる", () => {
				// Given: isDirty=true でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: true }));

				// When: beforeunload イベントを発火
				const beforeunloadHandler = addEventListenerSpy.mock.calls.find(
					([event]: [string, ...unknown[]]) => event === "beforeunload"
				)?.[1] as EventListener;

				const mockEvent = {
					preventDefault: vi.fn(),
				} as unknown as BeforeUnloadEvent;

				beforeunloadHandler(mockEvent);

				// Then: preventDefault が呼ばれる
				expect(mockEvent.preventDefault).toHaveBeenCalled();
			});

			it("isDirty が true から false に変わると beforeunload リスナーが解除される", () => {
				// Given: isDirty=true でフックをレンダリング
				const { rerender } = renderHook(
					({ isDirty }) => useUnsavedChangesAlert({ isDirty }),
					{ initialProps: { isDirty: true } }
				);

				// When: isDirty を false に変更
				rerender({ isDirty: false });

				// Then: beforeunload リスナーが解除される
				const removeBeforeunloadCalls =
					removeEventListenerSpy.mock.calls.filter(
						([event]: [string, ...unknown[]]) => event === "beforeunload"
					);
				expect(removeBeforeunloadCalls.length).toBeGreaterThan(0);
			});
		});

		describe("popstate イベント（ブラウザ戻るボタン）", () => {
			it("isDirty=true のとき popstate リスナーが登録され、ダミーの history エントリが追加される", () => {
				// Given/When: isDirty=true でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: true }));

				// Then: popstate イベントリスナーが登録される
				const popstateCalls = addEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "popstate"
				);
				expect(popstateCalls.length).toBeGreaterThan(0);

				// Then: ダミーのhistoryエントリが追加される
				expect(pushStateSpy).toHaveBeenCalledWith(
					null,
					"",
					window.location.href
				);
			});

			it("isDirty=false のとき popstate リスナーが登録されない", () => {
				// Given/When: isDirty=false でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: false }));

				// Then: popstate イベントリスナーが登録されない
				const popstateCalls = addEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "popstate"
				);
				expect(popstateCalls.length).toBe(0);
			});

			it("popstate 発火時にダイアログが表示される", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				// When: popstate イベントを発火
				const popstateHandler = addEventListenerSpy.mock.calls.find(
					([event]: [string, ...unknown[]]) => event === "popstate"
				)?.[1] as EventListener;

				act(() => {
					popstateHandler(new Event("popstate"));
				});

				// Then: ダイアログが表示される
				expect(result.current.showDialog).toBe(true);
				// Then: URLが復元される（pushStateが再度呼ばれる）
				expect(pushStateSpy).toHaveBeenCalledTimes(2);
			});

			it("popstate 後に「離脱する」を押すと history.go(-1) が呼ばれる", () => {
				// Given: isDirty=true でフックをレンダリングし、popstate を発火
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const popstateHandler = addEventListenerSpy.mock.calls.find(
					([event]: [string, ...unknown[]]) => event === "popstate"
				)?.[1] as EventListener;

				act(() => {
					popstateHandler(new Event("popstate"));
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm を呼ぶ
				act(() => {
					result.current.handleConfirm();
				});

				// Then: history.go(-1) が呼ばれてナビゲーションが実行される
				expect(goSpy).toHaveBeenCalledWith(-1);
				expect(result.current.showDialog).toBe(false);
			});

			it("isDirty が true から false に変わると popstate リスナーが解除される", () => {
				// Given: isDirty=true でフックをレンダリング
				const { rerender } = renderHook(
					({ isDirty }) => useUnsavedChangesAlert({ isDirty }),
					{ initialProps: { isDirty: true } }
				);

				// When: isDirty を false に変更
				rerender({ isDirty: false });

				// Then: popstate リスナーが解除される
				const removePopstateCalls = removeEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "popstate"
				);
				expect(removePopstateCalls.length).toBeGreaterThan(0);
			});
		});
	});
});
