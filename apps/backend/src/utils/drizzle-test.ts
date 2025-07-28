import { db } from "@saneatsu/db";
import { vi } from "vitest";
import type { MockDb } from "./vitest";

/**
 * データベースモックの設定を行う
 * NitoプロジェクトのsetupDbMocksを参考に実装
 */
export function setupDbMocks() {
	// vi.setup.tsでモックされたdbオブジェクトを取得
	const mockDb = db as unknown as MockDb;

	// insertとupdateのメソッドを追加
	mockDb.insert = vi.fn();
	mockDb.update = vi.fn();

	/**
	 * 基本的なモックチェーンを作成するヘルパー
	 * .from().leftJoin().where().orderBy().limit().offset() のようなメソッドチェーン用
	 */
	const createMockChain = (finalResult: unknown[]) => ({
		from: vi.fn().mockReturnValue({
			leftJoin: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue(finalResult),
						}),
					}),
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(finalResult),
					}),
				}),
			}),
			where: vi.fn().mockReturnValue({
				orderBy: vi.fn().mockReturnValue({
					limit: vi.fn().mockReturnValue({
						offset: vi.fn().mockResolvedValue(finalResult),
					}),
				}),
				limit: vi.fn().mockReturnValue({
					offset: vi.fn().mockResolvedValue(finalResult),
				}),
			}),
		}),
	});

	/**
	 * シンプルなモックチェーンを作成するヘルパー
	 * .from().where() で終わるような単純なクエリ用
	 */
	const createSimpleMockChain = (finalResult: unknown[]) => ({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				limit: vi.fn().mockResolvedValue(finalResult),
			}),
		}),
	});

	/**
	 * LEFT JOINを含むクエリ用のモックチェーン
	 */
	const createJoinMockChain = (finalResult: unknown[]) => ({
		from: vi.fn().mockReturnValue({
			leftJoin: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(finalResult),
					}),
					limit: vi.fn().mockResolvedValue(finalResult),
				}),
			}),
		}),
	});

	/**
	 * INNER JOINを含むクエリ用のモックチェーン（タグ取得用）
	 */
	const createInnerJoinMockChain = (finalResult: unknown[]) => ({
		from: vi.fn().mockReturnValue({
			innerJoin: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(finalResult),
				}),
			}),
		}),
	});

	return {
		mockDb,
		createMockChain,
		createSimpleMockChain,
		createJoinMockChain,
		createInnerJoinMockChain,
	};
}
