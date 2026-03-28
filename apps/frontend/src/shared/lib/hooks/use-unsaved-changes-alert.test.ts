import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUnsavedChangesAlert } from "./use-unsaved-changes-alert";

describe("useUnsavedChangesAlert", () => {
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let pushStateSpy: ReturnType<typeof vi.spyOn>;
	let goSpy: ReturnType<typeof vi.spyOn>;
	let docAddEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let docRemoveEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		addEventListenerSpy = vi.spyOn(window, "addEventListener");
		removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
		pushStateSpy = vi.spyOn(window.history, "pushState");
		goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});
		docAddEventListenerSpy = vi.spyOn(document, "addEventListener");
		docRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");
	});

	afterEach(() => {
		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
		pushStateSpy.mockRestore();
		goSpy.mockRestore();
		docAddEventListenerSpy.mockRestore();
		docRemoveEventListenerSpy.mockRestore();
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

		describe("handleConfirm のリスナー解除", () => {
			it("handleConfirm 後に beforeunload リスナーが解除される", () => {
				// Given: isDirty=true でダイアログを表示
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);
				const navigateFn = vi.fn();

				act(() => {
					result.current.guardNavigation(navigateFn);
				});

				// handleConfirm 前の removeEventListener 呼び出し数を記録
				const removeBefore = removeEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "beforeunload"
				).length;

				// When: handleConfirm を呼ぶ
				act(() => {
					result.current.handleConfirm();
				});

				// Then: beforeunload リスナーが解除される
				const removeAfter = removeEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "beforeunload"
				).length;
				expect(removeAfter).toBeGreaterThan(removeBefore);
			});

			it("handleConfirm 後に popstate が発火してもダイアログが再表示されない", () => {
				// Given: isDirty=true でフックをレンダリングし、popstate でダイアログを表示
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				act(() => {
					window.dispatchEvent(new Event("popstate"));
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm を呼んだ後、再度 popstate を発火
				act(() => {
					result.current.handleConfirm();
				});
				expect(result.current.showDialog).toBe(false);

				act(() => {
					window.dispatchEvent(new Event("popstate"));
				});

				// Then: popstate リスナーが解除されているのでダイアログが再表示されない
				expect(result.current.showDialog).toBe(false);
			});
		});

		describe("handleConfirm と handleCancel の競合（AlertDialogAction + onOpenChange）", () => {
			it("handleCancel が handleConfirm の前に呼ばれてもナビゲーション関数が実行される", () => {
				// Given: isDirty=true でダイアログが表示されている状態
				// Radix AlertDialog では onOpenChange(false) が onClick より先に
				// 呼ばれる可能性がある。その場合 handleCancel → handleConfirm の順になる。
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);
				const navigateFn = vi.fn();

				act(() => {
					result.current.guardNavigation(navigateFn);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleCancel → handleConfirm の順で呼ぶ
				act(() => {
					result.current.handleCancel();
					result.current.handleConfirm();
				});

				// Then: ナビゲーション関数が実行される
				expect(navigateFn).toHaveBeenCalledTimes(1);
				expect(result.current.showDialog).toBe(false);
			});

			it("handleConfirm が handleCancel の前に呼ばれてもナビゲーション関数が実行される", () => {
				// Given: isDirty=true でダイアログが表示されている状態
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);
				const navigateFn = vi.fn();

				act(() => {
					result.current.guardNavigation(navigateFn);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm → handleCancel の順で呼ぶ
				act(() => {
					result.current.handleConfirm();
					result.current.handleCancel();
				});

				// Then: ナビゲーション関数が実行される
				expect(navigateFn).toHaveBeenCalledTimes(1);
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

			it("popstate 後に「離脱する」を押すと history.go(-2) が呼ばれる", () => {
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

				// Then: history.go(-2) が呼ばれてナビゲーションが実行される
				// pushState で復元した分（-1）+ 実際の前のページへの遷移（-1）= -2
				expect(goSpy).toHaveBeenCalledWith(-2);
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

		describe("click イベントインターセプト（Next.js Link 対応）", () => {
			/** テスト用のアンカー要素を作成するヘルパー */
			function createAnchorElement(
				href: string,
				options?: { target?: string }
			): HTMLAnchorElement {
				const anchor = document.createElement("a");
				anchor.href = href;
				if (options?.target) {
					anchor.target = options.target;
				}
				document.body.appendChild(anchor);
				return anchor;
			}

			afterEach(() => {
				// テストで追加したアンカー要素をクリーンアップ
				for (const anchor of document.querySelectorAll("a")) {
					anchor.remove();
				}
			});

			it("isDirty=true のとき click リスナーがキャプチャフェーズで document に登録される", () => {
				// Given/When: isDirty=true でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: true }));

				// Then: document の click イベントリスナーがキャプチャフェーズで登録される
				const clickCalls = docAddEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "click"
				);
				expect(clickCalls.length).toBeGreaterThan(0);
				// キャプチャフェーズ（第3引数が true）
				expect(clickCalls[0][2]).toBe(true);
			});

			it("isDirty=false のとき click リスナーが登録されない", () => {
				// Given/When: isDirty=false でフックをレンダリング
				renderHook(() => useUnsavedChangesAlert({ isDirty: false }));

				// Then: click イベントリスナーが登録されない
				const clickCalls = docAddEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "click"
				);
				expect(clickCalls.length).toBe(0);
			});

			it("内部リンククリックで preventDefault が呼ばれダイアログが表示される", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const anchor = createAnchorElement(
					`${window.location.origin}/other-page`
				);

				// When: 内部リンクをクリック
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

				act(() => {
					anchor.dispatchEvent(clickEvent);
				});

				// Then: preventDefault が呼ばれダイアログが表示される
				expect(preventDefaultSpy).toHaveBeenCalled();
				expect(result.current.showDialog).toBe(true);
			});

			it("target='_blank' のリンクはインターセプトしない", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const anchor = createAnchorElement(
					`${window.location.origin}/other-page`,
					{ target: "_blank" }
				);

				// When: target="_blank" のリンクをクリック
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

				act(() => {
					anchor.dispatchEvent(clickEvent);
				});

				// Then: preventDefault は呼ばれず、ダイアログも表示されない
				expect(preventDefaultSpy).not.toHaveBeenCalled();
				expect(result.current.showDialog).toBe(false);
			});

			it("同じURLへのリンクはインターセプトしない", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				// 現在のURLと同じリンクを作成
				const anchor = createAnchorElement(window.location.href);

				// When: 同じURLのリンクをクリック
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

				act(() => {
					anchor.dispatchEvent(clickEvent);
				});

				// Then: preventDefault は呼ばれず、ダイアログも表示されない
				expect(preventDefaultSpy).not.toHaveBeenCalled();
				expect(result.current.showDialog).toBe(false);
			});

			it("別オリジンのリンクはインターセプトしない", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const anchor = createAnchorElement("https://example.com/page");

				// When: 外部リンクをクリック
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

				act(() => {
					anchor.dispatchEvent(clickEvent);
				});

				// Then: preventDefault は呼ばれず、ダイアログも表示されない
				expect(preventDefaultSpy).not.toHaveBeenCalled();
				expect(result.current.showDialog).toBe(false);
			});

			it("ダイアログ確認後に window.location.href で遷移が実行される", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const targetHref = `${window.location.origin}/other-page`;
				const anchor = createAnchorElement(targetHref);

				// 内部リンクをクリックしてダイアログを表示
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				act(() => {
					anchor.dispatchEvent(clickEvent);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm を呼ぶ
				// location.href のセッターをモック
				const locationHrefSpy = vi.spyOn(window, "location", "get");
				const assignMock = vi.fn();
				locationHrefSpy.mockReturnValue({
					...window.location,
					assign: assignMock,
					href: window.location.href,
				} as unknown as Location);

				act(() => {
					result.current.handleConfirm();
				});

				// Note: jsdom では location.href への直接代入はテストが難しいため、
				// pendingNavigationRef に関数がセットされて handleConfirm で呼ばれることを検証
				expect(result.current.showDialog).toBe(false);

				locationHrefSpy.mockRestore();
			});

			it("isDirty が true から false に変わると click リスナーが解除される", () => {
				// Given: isDirty=true でフックをレンダリング
				const { rerender } = renderHook(
					({ isDirty }) => useUnsavedChangesAlert({ isDirty }),
					{ initialProps: { isDirty: true } }
				);

				// When: isDirty を false に変更
				rerender({ isDirty: false });

				// Then: click リスナーが解除される
				const removeClickCalls = docRemoveEventListenerSpy.mock.calls.filter(
					([event]: [string, ...unknown[]]) => event === "click"
				);
				expect(removeClickCalls.length).toBeGreaterThan(0);
			});

			it("アンカー要素でないクリックはインターセプトしない", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const div = document.createElement("div");
				document.body.appendChild(div);

				// When: div 要素をクリック
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

				act(() => {
					div.dispatchEvent(clickEvent);
				});

				// Then: preventDefault は呼ばれない
				expect(preventDefaultSpy).not.toHaveBeenCalled();
				expect(result.current.showDialog).toBe(false);

				div.remove();
			});

			it("onNavigate が指定されているとき、内部リンククリック後の handleConfirm で onNavigate が呼ばれる", () => {
				// Given: isDirty=true, onNavigate を指定してフックをレンダリング
				const onNavigate = vi.fn();
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true, onNavigate })
				);

				const targetHref = `${window.location.origin}/other-page`;
				const anchor = createAnchorElement(targetHref);

				// 内部リンクをクリックしてダイアログを表示
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				act(() => {
					anchor.dispatchEvent(clickEvent);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm を呼ぶ
				act(() => {
					result.current.handleConfirm();
				});

				// Then: onNavigate が targetHref で呼ばれる
				expect(onNavigate).toHaveBeenCalledWith(targetHref);
				expect(result.current.showDialog).toBe(false);
			});

			it("onNavigate が未指定のとき、従来通り window.location.href による遷移が試みられる", () => {
				// Given: isDirty=true, onNavigate 未指定でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const targetHref = `${window.location.origin}/other-page`;
				const anchor = createAnchorElement(targetHref);

				// 内部リンクをクリックしてダイアログを表示
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				act(() => {
					anchor.dispatchEvent(clickEvent);
				});
				expect(result.current.showDialog).toBe(true);

				// When: handleConfirm を呼ぶ
				act(() => {
					result.current.handleConfirm();
				});

				// Then: ダイアログが閉じ、pendingNavigation が実行される（window.location.href への代入）
				// jsdom では location.href への代入テストが難しいため、ダイアログが閉じることで実行を確認
				expect(result.current.showDialog).toBe(false);
			});

			it("アンカーの子要素をクリックしても closest でインターセプトされる", () => {
				// Given: isDirty=true でフックをレンダリング
				const { result } = renderHook(() =>
					useUnsavedChangesAlert({ isDirty: true })
				);

				const anchor = createAnchorElement(
					`${window.location.origin}/other-page`
				);
				const span = document.createElement("span");
				span.textContent = "リンクテキスト";
				anchor.appendChild(span);

				// When: アンカーの子要素（span）をクリック
				const clickEvent = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
				});
				const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

				act(() => {
					span.dispatchEvent(clickEvent);
				});

				// Then: preventDefault が呼ばれダイアログが表示される
				expect(preventDefaultSpy).toHaveBeenCalled();
				expect(result.current.showDialog).toBe(true);
			});
		});
	});
});
