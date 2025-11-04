import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { Mapbox } from "./mapbox";

// env をモック
vi.mock("@/env", () => ({
	env: {
		NEXT_PUBLIC_MAPBOX_TOKEN: "test-token",
	},
}));

// react-map-gl をモック
vi.mock("react-map-gl/mapbox", () => ({
	__esModule: true,
	default: ({
		latitude,
		longitude,
		zoom,
		onMove: _onMove,
		onClick: _onClick,
		mapStyle: _mapStyle,
		mapboxAccessToken: _mapboxAccessToken,
		style: _style,
		children,
	}: {
		latitude: number;
		longitude: number;
		zoom: number;
		onMove: () => void;
		onClick: () => void;
		mapStyle: string;
		mapboxAccessToken: string;
		style: React.CSSProperties;
		children: React.ReactNode;
	}) => (
		<div
			data-testid="mapbox-map"
			data-latitude={latitude}
			data-longitude={longitude}
			data-zoom={zoom}
		>
			{children}
		</div>
	),
	Marker: ({
		latitude,
		longitude,
		draggable,
		onDragEnd: _onDragEnd,
		children,
	}: {
		latitude: number;
		longitude: number;
		draggable: boolean;
		onDragEnd: () => void;
		children: React.ReactNode;
	}) => (
		<div
			data-testid="mapbox-marker"
			data-latitude={latitude}
			data-longitude={longitude}
			data-draggable={draggable}
		>
			{children}
		</div>
	),
}));

describe("Mapbox", () => {
	describe("Unit Test", () => {
		describe("デフォルト位置", () => {
			test("centerプロップが指定されていない場合、東京駅の座標で初期化される", () => {
				const { getByTestId } = render(<Mapbox />);

				const map = getByTestId("mapbox-map");

				// 東京駅の座標
				expect(map.getAttribute("data-latitude")).toBe("35.6812");
				expect(map.getAttribute("data-longitude")).toBe("139.7671");
			});

			test("centerプロップが指定されている場合、その座標で初期化される", () => {
				const { getByTestId } = render(
					<Mapbox center={{ latitude: 35.6586, longitude: 139.7454 }} />
				);

				const map = getByTestId("mapbox-map");

				expect(map.getAttribute("data-latitude")).toBe("35.6586");
				expect(map.getAttribute("data-longitude")).toBe("139.7454");
			});
		});

		describe("マーカー変更時の地図中心移動", () => {
			test("markerプロップが変更されたら、地図の中心位置も更新される", () => {
				const { getByTestId, rerender } = render(
					<Mapbox marker={{ latitude: 35.6586, longitude: 139.7454 }} />
				);

				const map = getByTestId("mapbox-map");

				// 初期表示の時点でマーカー位置に地図の中心が移動している
				expect(map.getAttribute("data-latitude")).toBe("35.6586");
				expect(map.getAttribute("data-longitude")).toBe("139.7454");

				// markerを別の位置に変更
				rerender(
					<Mapbox marker={{ latitude: 35.6812, longitude: 139.7671 }} />
				);

				// 地図の中心が新しいマーカー位置に移動する
				// ⚠️ このテストは最初は失敗するはず（useEffectがない）
				expect(map.getAttribute("data-latitude")).toBe("35.6812");
				expect(map.getAttribute("data-longitude")).toBe("139.7671");
			});

			test("markerがnullから座標に変更されたら、地図の中心位置も更新される", () => {
				const { getByTestId, rerender } = render(<Mapbox marker={null} />);

				const map = getByTestId("mapbox-map");

				// 初期位置（東京駅）
				expect(map.getAttribute("data-latitude")).toBe("35.6812");
				expect(map.getAttribute("data-longitude")).toBe("139.7671");

				// markerを設定
				rerender(
					<Mapbox marker={{ latitude: 35.6586, longitude: 139.7454 }} />
				);

				// 地図の中心がマーカー位置に移動する
				// ⚠️ このテストは最初は失敗するはず（useEffectがない）
				expect(map.getAttribute("data-latitude")).toBe("35.6586");
				expect(map.getAttribute("data-longitude")).toBe("139.7454");
			});

			test("markerが座標からnullに変更されても、地図の中心位置は変わらない", () => {
				const { getByTestId, rerender } = render(
					<Mapbox marker={{ latitude: 35.6586, longitude: 139.7454 }} />
				);

				const map = getByTestId("mapbox-map");

				// markerをnullに変更
				rerender(<Mapbox marker={null} />);

				// 地図の中心位置は最後の位置のまま
				expect(map.getAttribute("data-latitude")).toBe("35.6586");
				expect(map.getAttribute("data-longitude")).toBe("139.7454");
			});
		});

		describe("マーカー表示", () => {
			test("markerプロップが指定されている場合、マーカーが表示される", () => {
				const { getByTestId } = render(
					<Mapbox marker={{ latitude: 35.6586, longitude: 139.7454 }} />
				);

				const marker = getByTestId("mapbox-marker");

				expect(marker).toBeInTheDocument();
				expect(marker.getAttribute("data-latitude")).toBe("35.6586");
				expect(marker.getAttribute("data-longitude")).toBe("139.7454");
			});

			test("markerプロップがnullの場合、マーカーは表示されない", () => {
				const { queryByTestId } = render(<Mapbox marker={null} />);

				const marker = queryByTestId("mapbox-marker");

				expect(marker).not.toBeInTheDocument();
			});
		});
	});
});
