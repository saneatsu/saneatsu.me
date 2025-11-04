import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { AddressSearch } from "./address-search";

// useSearchGeocoding をモック
const mockUseSearchGeocoding = vi.fn();

vi.mock("../../api/use-search-geocoding/use-search-geocoding", () => ({
	useSearchGeocoding: (...args: unknown[]) => mockUseSearchGeocoding(...args),
}));

// next-intl の useLocale をモック
vi.mock("next-intl", () => ({
	useLocale: () => "ja",
}));

describe("AddressSearch", () => {
	describe("Unit Test", () => {
		describe("自動再検索", () => {
			test("テキストを削除したときに自動的に新しい検索結果が表示される", async () => {
				const user = userEvent.setup();
				const onSelect = vi.fn();

				// useSearchGeocoding のモック実装
				mockUseSearchGeocoding.mockImplementation((params) => {
					if (params.q === "文京区役所" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "文京区役所",
										fullAddress: "東京都文京区春日1-16-21",
										coordinates: { latitude: 35.7123, longitude: 139.7525 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					if (params.q === "文京区" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "文京区",
										fullAddress: "東京都文京区",
										coordinates: { latitude: 35.7081, longitude: 139.7511 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					return {
						data: null,
						isLoading: false,
						error: null,
					};
				});

				render(<AddressSearch onSelect={onSelect} />);

				const input = screen.getByPlaceholderText("住所を入力してください");
				const searchButton = screen.getByRole("button");

				// 1. 「文京区役所」と入力して検索
				await user.type(input, "文京区役所");
				await user.click(searchButton);

				// 「文京区役所」の検索結果が表示される
				expect(await screen.findByText("文京区役所")).toBeInTheDocument();

				// 2. 「役所」を削除（バックスペースを2回押す）
				await user.click(input); // フォーカス
				await user.keyboard("{End}"); // カーソルを末尾に移動
				await user.keyboard("{Backspace}{Backspace}");

				// 自動的に「文京区」の検索結果が表示される
				expect(await screen.findByText("文京区")).toBeInTheDocument();
				expect(screen.queryByText("文京区役所")).not.toBeInTheDocument();
			});

			test("すべて削除したら検索結果がクリアされる", async () => {
				const user = userEvent.setup();
				const onSelect = vi.fn();

				// useSearchGeocoding のモック実装
				mockUseSearchGeocoding.mockImplementation((params) => {
					if (params.q === "文京区" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "文京区",
										fullAddress: "東京都文京区",
										coordinates: { latitude: 35.7081, longitude: 139.7511 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					return {
						data: null,
						isLoading: false,
						error: null,
					};
				});

				render(<AddressSearch onSelect={onSelect} />);

				const input = screen.getByPlaceholderText("住所を入力してください");
				const searchButton = screen.getByRole("button");

				// 1. 「文京区」と入力して検索
				await user.type(input, "文京区");
				await user.click(searchButton);

				// 検索結果が表示される
				expect(await screen.findByText("文京区")).toBeInTheDocument();

				// 2. すべて削除（バックスペースを3回押す）
				await user.click(input);
				await user.keyboard("{End}");
				await user.keyboard("{Backspace}{Backspace}{Backspace}");

				// 検索結果がクリアされる
				expect(screen.queryByText("文京区")).not.toBeInTheDocument();
			});

			test("住所を選択したら、正しい座標でonSelectが呼ばれる", async () => {
				const user = userEvent.setup();
				const onSelect = vi.fn();

				// useSearchGeocoding のモック実装
				mockUseSearchGeocoding.mockImplementation((params) => {
					if (params.q === "東京タワー" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "東京タワー",
										fullAddress: "東京都港区芝公園4-2-8",
										coordinates: { latitude: 35.6586, longitude: 139.7454 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					return {
						data: null,
						isLoading: false,
						error: null,
					};
				});

				render(<AddressSearch onSelect={onSelect} />);

				const input = screen.getByPlaceholderText("住所を入力してください");
				const searchButton = screen.getByRole("button");

				// 「東京タワー」と入力して検索
				await user.type(input, "東京タワー");
				await user.click(searchButton);

				// 検索結果が表示される
				const resultButton = await screen.findByText("東京タワー");

				// 検索結果をクリックして選択
				await user.click(resultButton);

				// onSelectが正しい座標で呼ばれる
				expect(onSelect).toHaveBeenCalledWith(
					{ latitude: 35.6586, longitude: 139.7454 },
					"東京都港区芝公園4-2-8"
				);
			});

			test("検索結果を選択したら、選択した住所が入力フィールドに表示される", async () => {
				const user = userEvent.setup();
				const onSelect = vi.fn();

				// useSearchGeocoding のモック実装
				mockUseSearchGeocoding.mockImplementation((params) => {
					if (params.q === "東京タワー" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "東京タワー",
										fullAddress: "東京都港区芝公園4-2-8",
										coordinates: { latitude: 35.6586, longitude: 139.7454 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					return {
						data: null,
						isLoading: false,
						error: null,
					};
				});

				render(<AddressSearch onSelect={onSelect} />);

				const input = screen.getByPlaceholderText("住所を入力してください");
				const searchButton = screen.getByRole("button");

				// 1. 「東京タワー」と入力して検索
				await user.type(input, "東京タワー");
				await user.click(searchButton);

				// 検索結果が表示される
				const resultButton = await screen.findByText("東京タワー");
				expect(resultButton).toBeInTheDocument();

				// 2. 検索結果をクリックして選択
				await user.click(resultButton);

				// onSelect が呼ばれる
				expect(onSelect).toHaveBeenCalledWith(
					{ latitude: 35.6586, longitude: 139.7454 },
					"東京都港区芝公園4-2-8"
				);

				// 3. 選択した住所が入力フィールドに表示される（クリアされない）
				// ⚠️ このテストは最初は失敗するはず（現在はクリアされる）
				expect(input).toHaveValue("東京都港区芝公園4-2-8");

				// 4. 検索結果リストは非表示になる
				expect(screen.queryByText("東京タワー")).not.toBeInTheDocument();
			});

			test("削除後に文字を追加した場合は自動検索されない", async () => {
				const user = userEvent.setup();
				const onSelect = vi.fn();

				// useSearchGeocoding のモック実装
				mockUseSearchGeocoding.mockImplementation((params) => {
					if (params.q === "文京区役所" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "文京区役所",
										fullAddress: "東京都文京区春日1-16-21",
										coordinates: { latitude: 35.7123, longitude: 139.7525 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					if (params.q === "文京区公園" && params.enabled) {
						return {
							data: {
								features: [
									{
										name: "文京区公園",
										fullAddress: "東京都文京区公園",
										coordinates: { latitude: 35.71, longitude: 139.76 },
									},
								],
							},
							isLoading: false,
							error: null,
						};
					}
					return {
						data: null,
						isLoading: false,
						error: null,
					};
				});

				render(<AddressSearch onSelect={onSelect} />);

				const input = screen.getByPlaceholderText("住所を入力してください");
				const searchButton = screen.getByRole("button");

				// 1. 「文京区役所」と入力して検索
				await user.type(input, "文京区役所");
				await user.click(searchButton);

				// 検索結果が表示される
				expect(await screen.findByText("文京区役所")).toBeInTheDocument();

				// 2. 「役所」を削除して「文京区」にする
				await user.click(input);
				await user.keyboard("{End}");
				await user.keyboard("{Backspace}{Backspace}");

				// 3. 「公園」を追加
				await user.keyboard("公園");

				// 自動検索されないので、まだ「文京区役所」が表示されている
				// 「文京区公園」は表示されない
				expect(screen.queryByText("文京区公園")).not.toBeInTheDocument();

				// 4. 検索ボタンをクリック
				await user.click(searchButton);

				// 「文京区公園」が表示される
				expect(await screen.findByText("文京区公園")).toBeInTheDocument();
			});
		});
	});
});
