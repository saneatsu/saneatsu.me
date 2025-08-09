import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserByEmail, isAdminEmail, upsertUserFromGoogle } from "./service";

// 実際のテーブル定義をインポート
import { users } from "@saneatsu/db/worker";

// DBクライアントのモック
const mockDb = {
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	from: vi.fn(),
	where: vi.fn(),
	limit: vi.fn(),
	values: vi.fn(),
	set: vi.fn(),
	returning: vi.fn(),
};

describe("Auth Service", () => {
	describe("isAdminEmail", () => {
		it("管理者メールアドレスのリストに含まれている場合はtrueを返す", () => {
			const adminEmails = "admin@example.com,test@example.com,root@domain.com";

			expect(isAdminEmail("admin@example.com", adminEmails)).toBe(true);
			expect(isAdminEmail("test@example.com", adminEmails)).toBe(true);
			expect(isAdminEmail("root@domain.com", adminEmails)).toBe(true);
		});

		it("管理者メールアドレスのリストに含まれていない場合はfalseを返す", () => {
			const adminEmails = "admin@example.com,test@example.com";

			expect(isAdminEmail("user@example.com", adminEmails)).toBe(false);
			expect(isAdminEmail("notadmin@domain.com", adminEmails)).toBe(false);
		});

		it("空白を含むメールアドレスでも正しく判定できる", () => {
			const adminEmails =
				" admin@example.com , test@example.com , root@domain.com ";

			expect(isAdminEmail("admin@example.com", adminEmails)).toBe(true);
			expect(isAdminEmail("test@example.com", adminEmails)).toBe(true);
		});

		it("空の管理者リストの場合は常にfalseを返す", () => {
			expect(isAdminEmail("admin@example.com", "")).toBe(false);
			expect(isAdminEmail("admin@example.com", "   ")).toBe(false);
		});
	});

	describe("upsertUserFromGoogle", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("新規ユーザーを作成できる", async () => {
			// 既存ユーザーなしのモック
			const mockSelectChain = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};
			mockDb.select.mockReturnValue(mockSelectChain);

			// 新規作成のモック
			const mockInsertChain = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: 1,
							email: "new@example.com",
							name: "New User",
							avatarUrl: "https://example.com/avatar.jpg",
							provider: "google",
							providerId: "123456",
							createdAt: "2024-01-01T00:00:00.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					]),
				}),
			};
			mockDb.insert.mockReturnValue(mockInsertChain);

			const profile = {
				email: "new@example.com",
				name: "New User",
				picture: "https://example.com/avatar.jpg",
				sub: "123456",
			};

			const result = await upsertUserFromGoogle(mockDb as any, profile);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.insert).toHaveBeenCalledWith(users);
			expect(mockInsertChain.values).toHaveBeenCalledWith({
				email: "new@example.com",
				name: "New User",
				avatarUrl: "https://example.com/avatar.jpg",
				provider: "google",
				providerId: "123456",
			});

			expect(result).toMatchObject({
				email: "new@example.com",
				name: "New User",
			});
		});

		it("既存ユーザーを更新できる", async () => {
			// 既存ユーザーありのモック
			const existingUser = {
				id: 1,
				email: "existing@example.com",
				name: "Old Name",
				avatarUrl: null,
			};

			const mockSelectChain = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([existingUser]),
					}),
				}),
			};
			mockDb.select.mockReturnValue(mockSelectChain);

			// 更新のモック
			const mockUpdateChain = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								...existingUser,
								name: "Updated Name",
								avatarUrl: "https://example.com/new-avatar.jpg",
								updatedAt: expect.any(String),
							},
						]),
					}),
				}),
			};
			mockDb.update.mockReturnValue(mockUpdateChain);

			const profile = {
				email: "existing@example.com",
				name: "Updated Name",
				picture: "https://example.com/new-avatar.jpg",
				sub: "123456",
			};

			const result = await upsertUserFromGoogle(mockDb as any, profile);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.update).toHaveBeenCalledWith(users);
			expect(mockUpdateChain.set).toHaveBeenCalledWith({
				name: "Updated Name",
				avatarUrl: "https://example.com/new-avatar.jpg",
				updatedAt: expect.any(String),
			});

			expect(result).toMatchObject({
				name: "Updated Name",
				avatarUrl: "https://example.com/new-avatar.jpg",
			});
		});

		it("pictureが未設定の場合でも正常に動作する", async () => {
			const mockSelectChain = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};
			mockDb.select.mockReturnValue(mockSelectChain);

			const mockInsertChain = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: 1,
							email: "nopic@example.com",
							name: "No Picture User",
							avatarUrl: undefined,
							provider: "google",
							providerId: "123456",
						},
					]),
				}),
			};
			mockDb.insert.mockReturnValue(mockInsertChain);

			const profile = {
				email: "nopic@example.com",
				name: "No Picture User",
				sub: "123456",
			};

			await upsertUserFromGoogle(mockDb as any, profile);

			expect(mockInsertChain.values).toHaveBeenCalledWith({
				email: "nopic@example.com",
				name: "No Picture User",
				avatarUrl: undefined,
				provider: "google",
				providerId: "123456",
			});
		});
	});

	describe("getUserByEmail", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("存在するユーザーを取得できる", async () => {
			const mockUser = {
				id: 1,
				email: "test@example.com",
				name: "Test User",
				avatarUrl: "https://example.com/avatar.jpg",
				provider: "google",
				providerId: "123456",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockSelectChain = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockUser]),
					}),
				}),
			};
			mockDb.select.mockReturnValue(mockSelectChain);

			const result = await getUserByEmail(mockDb as any, "test@example.com");

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockSelectChain.from).toHaveBeenCalledWith(users);
			expect(result).toEqual(mockUser);
		});

		it("存在しないユーザーの場合はnullを返す", async () => {
			const mockSelectChain = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};
			mockDb.select.mockReturnValue(mockSelectChain);

			const result = await getUserByEmail(
				mockDb as any,
				"notfound@example.com"
			);

			expect(result).toBeNull();
		});

		it("正しいメールアドレスでクエリが実行される", async () => {
			const mockLimit = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({
				limit: mockLimit,
			});
			const mockSelectChain = {
				from: vi.fn().mockReturnValue({
					where: mockWhere,
				}),
			};
			mockDb.select.mockReturnValue(mockSelectChain);

			await getUserByEmail(mockDb as any, "query@example.com");

			expect(mockWhere).toHaveBeenCalledWith(expect.anything());
			expect(mockLimit).toHaveBeenCalledWith(1);
		});
	});
});
