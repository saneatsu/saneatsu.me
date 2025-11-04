import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { CoordinatesInput } from "./coordinates-input";

describe("CoordinatesInput", () => {
	describe("Unit Test", () => {
		describe("外部からのvalue変更", () => {
			test("valueプロップが変更されたら、入力フィールドが更新される", async () => {
				const onChange = vi.fn();

				// 初期値で描画
				const { rerender } = render(
					<CoordinatesInput
						value={{ latitude: 35.6586, longitude: 139.7454 }}
						onChange={onChange}
					/>
				);

				// 初期値が表示される
				const latitudeInput = screen.getByLabelText("緯度");
				const longitudeInput = screen.getByLabelText("経度");

				expect(latitudeInput).toHaveValue("35.6586");
				expect(longitudeInput).toHaveValue("139.7454");

				// valueを変更してrerender
				rerender(
					<CoordinatesInput
						value={{ latitude: 35.6812, longitude: 139.7671 }}
						onChange={onChange}
					/>
				);

				// 新しい値が表示される
				// ⚠️ このテストは最初は失敗するはず（useEffectがない）
				expect(latitudeInput).toHaveValue("35.6812");
				expect(longitudeInput).toHaveValue("139.7671");
			});

			test("nullから座標値に変更されたら、入力フィールドが更新される", async () => {
				const onChange = vi.fn();

				// null で描画
				const { rerender } = render(
					<CoordinatesInput value={null} onChange={onChange} />
				);

				const latitudeInput = screen.getByLabelText("緯度");
				const longitudeInput = screen.getByLabelText("経度");

				// 初期状態は空
				expect(latitudeInput).toHaveValue("");
				expect(longitudeInput).toHaveValue("");

				// 座標値を設定
				rerender(
					<CoordinatesInput
						value={{ latitude: 35.6586, longitude: 139.7454 }}
						onChange={onChange}
					/>
				);

				// 座標が表示される
				// ⚠️ このテストは最初は失敗するはず（useEffectがない）
				expect(latitudeInput).toHaveValue("35.6586");
				expect(longitudeInput).toHaveValue("139.7454");
			});

			test("座標値からnullに変更されたら、入力フィールドがクリアされる", async () => {
				const onChange = vi.fn();

				// 座標値で描画
				const { rerender } = render(
					<CoordinatesInput
						value={{ latitude: 35.6586, longitude: 139.7454 }}
						onChange={onChange}
					/>
				);

				const latitudeInput = screen.getByLabelText("緯度");
				const longitudeInput = screen.getByLabelText("経度");

				// 初期値が表示される
				expect(latitudeInput).toHaveValue("35.6586");
				expect(longitudeInput).toHaveValue("139.7454");

				// nullに変更
				rerender(<CoordinatesInput value={null} onChange={onChange} />);

				// 入力フィールドがクリアされる
				// ⚠️ このテストは最初は失敗するはず（useEffectがない）
				expect(latitudeInput).toHaveValue("");
				expect(longitudeInput).toHaveValue("");
			});
		});

		describe("ユーザー入力", () => {
			test("緯度を入力したら、onChangeが呼ばれる", async () => {
				const user = userEvent.setup();
				const onChange = vi.fn();

				render(<CoordinatesInput value={null} onChange={onChange} />);

				const latitudeInput = screen.getByLabelText("緯度");

				// 緯度を入力
				await user.type(latitudeInput, "35.6586");

				// onChangeが呼ばれる
				expect(onChange).toHaveBeenCalled();
			});

			test("経度を入力したら、onChangeが呼ばれる", async () => {
				const user = userEvent.setup();
				const onChange = vi.fn();

				render(<CoordinatesInput value={null} onChange={onChange} />);

				const longitudeInput = screen.getByLabelText("経度");

				// 経度を入力
				await user.type(longitudeInput, "139.7454");

				// onChangeが呼ばれる
				expect(onChange).toHaveBeenCalled();
			});
		});
	});
});
