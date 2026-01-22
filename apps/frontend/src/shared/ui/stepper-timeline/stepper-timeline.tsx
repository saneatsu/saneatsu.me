"use client";

import { defineStepper } from "@stepperize/react";
import * as React from "react";
import type { SimpleIcon } from "simple-icons";

import type { TimelineItem as TimelineItemType } from "../../types";
import { BadgeWithIcon, Card, CardContent } from "../../ui";

/**
 * StepperTimelineコンポーネントのProps
 */
export type StepperTimelineProps = {
	/**
	 * タイムラインに表示するアイテムの配列
	 *
	 * @description
	 * 新しい順（最新が最初）で渡すことを想定している。
	 */
	items: TimelineItemType[];
	/**
	 * アイテムのタイトルがクリックされたときのコールバック
	 *
	 * @description
	 * 疎結合設計のため、クリックイベントは親コンポーネントに委譲する。
	 * このコールバックが提供されない場合、タイトルはクリック不可になる。
	 */
	onItemClick?: (item: TimelineItemType) => void;
};

/**
 * 期間を文字列にフォーマットする関数
 *
 * @param from - 開始日（YYYY-MM形式または年のみ）
 * @param to - 終了日（YYYY-MM形式、年のみ、またはnull）
 * @returns フォーマットされた期間文字列
 *
 * @example
 * formatPeriod("2024-01", null) // "2024-01 - 現在"
 * formatPeriod("2022", "2023") // "2022 - 2023"
 * formatPeriod("2023-04", "2023-12") // "2023-04 - 2023-12"
 */
function formatPeriod(from: string, to: string | null): string {
	if (to === null) {
		return `${from} - 現在`;
	}
	return `${from} - ${to}`;
}

/**
 * StepperTimelineコンポーネント
 *
 * @description
 * stepperizeを使用して、経歴データを縦方向のタイムラインとして表示するコンポーネント。
 * 各経歴項目は「ステップ」として管理され、縦線、ドットマーカー、期間、タイトル、
 * 説明、技術バッジが表示される。
 *
 * ## 実装の詳細
 * 1. 経歴データを受け取り、defineStepperでステップとして定義
 * 2. useStepper()フックで管理
 * 3. 全ステップを縦に並べて表示
 * 4. 既存のTimelineItemと同じビジュアルデザイン
 */
export function StepperTimeline({ items, onItemClick }: StepperTimelineProps) {
	// 経歴データからステップを定義
	// 空の場合はダミーステップを作成してフックルールに従う
	const steps =
		items.length > 0
			? items.map((item, index) => ({
					id: `step-${index}`,
					data: item,
				}))
			: [{ id: "empty", data: null }];

	// stepperを定義
	const { useStepper } = defineStepper(...steps);

	// useStepper()フックを使用してステップ管理
	const stepper = useStepper();

	// 空の場合は何も表示しない（フックの後にチェック）
	if (items.length === 0) {
		return null;
	}

	return (
		<div className="relative">
			{stepper.all.map((step, index, array) => {
				const item = step.data as TimelineItemType;

				return (
					<React.Fragment key={step.id}>
						{/* アイテム本体 */}
						<div className="flex gap-4">
							{/* 左側のマーカー部分（ドットと縦線） */}
							<div className="flex flex-col items-center">
								{/* ドットマーカー */}
								<div
									className="w-3 h-3 rounded-full bg-primary mt-4 shrink-0"
									aria-hidden="true"
								/>

								{/* 縦線（最後のアイテムでは表示しない） */}
								{index < array.length - 1 && (
									<div
										className="w-px flex-1 bg-border mt-4"
										aria-hidden="true"
									/>
								)}
							</div>

							{/* 右側のコンテンツ部分 */}
							<div className="flex-1 pt-3 pb-8">
								{onItemClick ? (
									<Card
										role="button"
										tabIndex={0}
										onClick={() => {
											onItemClick(item);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onItemClick(item);
											}
										}}
										className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										aria-label={`View details for ${item.companyName}`}
									>
										<CardContent>
											{/* 期間 */}
											<p className="text-sm text-muted-foreground mb-1">
												{formatPeriod(item.period.from, item.period.to)}
											</p>

											{/* 会社名 */}
											<h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
												{item.logoUrl && (
													<img
														src={item.logoUrl}
														alt={`${item.companyName} logo`}
														className="w-6 h-6 object-contain shrink-0"
													/>
												)}
												<span>{item.companyName}</span>
											</h3>

											{/* 技術スタックのバッジ */}
											{item.techStack && item.techStack.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{item.techStack.map((tech: SimpleIcon) => (
														<BadgeWithIcon
															key={tech.slug}
															icon={tech}
															text={tech.title}
														/>
													))}
												</div>
											)}
										</CardContent>
									</Card>
								) : (
									<>
										{/* 期間 */}
										<p className="text-sm text-muted-foreground mb-1">
											{formatPeriod(item.period.from, item.period.to)}
										</p>

										{/* 会社名 */}
										<h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
											{item.logoUrl && (
												<img
													src={item.logoUrl}
													alt={`${item.companyName} logo`}
													className="w-6 h-6 object-contain shrink-0"
												/>
											)}
											<span>{item.companyName}</span>
										</h3>

										{/* 技術スタックのバッジ */}
										{item.techStack && item.techStack.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{item.techStack.map((tech: SimpleIcon) => (
													<BadgeWithIcon
														key={tech.slug}
														icon={tech}
														text={tech.title}
													/>
												))}
											</div>
										)}
									</>
								)}
							</div>
						</div>
					</React.Fragment>
				);
			})}
		</div>
	);
}
