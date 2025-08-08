import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authRoute } from "./worker";

// モックの設定
vi.mock("./service", () => ({
	isAdminEmail: vi.fn(),
	upsertUserFromGoogle: vi.fn(),
	getUserByEmail: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
	createDbClient: vi.fn(),
}));

// 環境変数の型定義
type Env = {
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	ADMIN_EMAILS?: string;
};

describe("Auth API Routes", () => {
	let app: OpenAPIHono<{ Bindings: Env }>;

	beforeEach(() => {
		app = new OpenAPIHono<{ Bindings: Env }>();
		app.route("/api/auth", authRoute);
	});

	describe("POST /api/auth/user", () => {
		const mockEnv = {
			TURSO_DATABASE_URL: "libsql://test.turso.io",
			TURSO_AUTH_TOKEN: "test-token",
			ADMIN_EMAILS: "admin@example.com,test@example.com",
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("管理者メールアドレスでユーザーを作成できる", async () => {
			const { isAdminEmail, upsertUserFromGoogle } = await import("./service");
			const { createDbClient } = await import("../../lib/db");

			vi.mocked(isAdminEmail).mockReturnValue(true);
			vi.mocked(createDbClient).mockReturnValue({} as any);
			vi.mocked(upsertUserFromGoogle).mockResolvedValue({
				id: 1,
				email: "admin@example.com",
				name: "Admin User",
				avatarUrl: "https://example.com/avatar.jpg",
				provider: "google",
				providerId: "123456",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			});

			const res = await app.request(
				"/api/auth/user",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: "admin@example.com",
						name: "Admin User",
						picture: "https://example.com/avatar.jpg",
						sub: "123456",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toMatchObject({
				email: "admin@example.com",
				name: "Admin User",
				isAdmin: true,
			});
		});

		it("管理者以外のメールアドレスで403エラーを返す", async () => {
			const { isAdminEmail } = await import("./service");
			vi.mocked(isAdminEmail).mockReturnValue(false);

			const res = await app.request(
				"/api/auth/user",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: "notadmin@example.com",
						name: "Not Admin",
						picture: "https://example.com/avatar.jpg",
						sub: "123456",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(403);
			const data = await res.json();
			expect(data).toMatchObject({
				error: {
					code: "FORBIDDEN",
					message: "管理者権限がありません",
				},
			});
		});

		it("既存ユーザーの情報を更新できる", async () => {
			const { isAdminEmail, upsertUserFromGoogle } = await import("./service");
			const { createDbClient } = await import("../../lib/db");

			vi.mocked(isAdminEmail).mockReturnValue(true);
			vi.mocked(createDbClient).mockReturnValue({} as any);
			vi.mocked(upsertUserFromGoogle).mockResolvedValue({
				id: 1,
				email: "admin@example.com",
				name: "Updated Name",
				avatarUrl: "https://example.com/new-avatar.jpg",
				provider: "google",
				providerId: "123456",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
			});

			const res = await app.request(
				"/api/auth/user",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: "admin@example.com",
						name: "Updated Name",
						picture: "https://example.com/new-avatar.jpg",
						sub: "123456",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toMatchObject({
				email: "admin@example.com",
				name: "Updated Name",
				avatarUrl: "https://example.com/new-avatar.jpg",
				isAdmin: true,
			});
		});
	});

	describe("GET /api/auth/user/:email", () => {
		const mockEnv = {
			TURSO_DATABASE_URL: "libsql://test.turso.io",
			TURSO_AUTH_TOKEN: "test-token",
			ADMIN_EMAILS: "admin@example.com",
		};

		it("存在するユーザー情報を取得できる", async () => {
			const { getUserByEmail } = await import("./service");
			const { createDbClient } = await import("../../lib/db");

			vi.mocked(createDbClient).mockReturnValue({} as any);
			vi.mocked(getUserByEmail).mockResolvedValue({
				id: 1,
				email: "admin@example.com",
				name: "Admin User",
				avatarUrl: null,
				provider: "google",
				providerId: "123456",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			});

			const res = await app.request(
				"/api/auth/user/admin@example.com",
				{
					method: "GET",
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toMatchObject({
				email: "admin@example.com",
				name: "Admin User",
				isAdmin: true,
			});
		});

		it("存在しないユーザーで404エラーを返す", async () => {
			const { getUserByEmail } = await import("./service");
			const { createDbClient } = await import("../../lib/db");

			vi.mocked(createDbClient).mockReturnValue({} as any);
			vi.mocked(getUserByEmail).mockResolvedValue(null);

			const res = await app.request(
				"/api/auth/user/notfound@example.com",
				{
					method: "GET",
				},
				mockEnv
			);

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data).toMatchObject({
				error: {
					code: "USER_NOT_FOUND",
					message: "ユーザーが見つかりません",
				},
			});
		});

		it("管理者以外のユーザーでisAdminがfalseになる", async () => {
			const { getUserByEmail, isAdminEmail } = await import("./service");
			const { createDbClient } = await import("../../lib/db");

			vi.mocked(createDbClient).mockReturnValue({} as any);
			vi.mocked(getUserByEmail).mockResolvedValue({
				id: 2,
				email: "user@example.com",
				name: "Regular User",
				avatarUrl: null,
				provider: "google",
				providerId: "789012",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			});
			// user@example.comは管理者リストに含まれていないため、falseを返すように設定
			vi.mocked(isAdminEmail).mockReturnValueOnce(false);

			const res = await app.request(
				"/api/auth/user/user@example.com",
				{
					method: "GET",
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toMatchObject({
				email: "user@example.com",
				name: "Regular User",
				isAdmin: false,
			});
		});
	});
});
