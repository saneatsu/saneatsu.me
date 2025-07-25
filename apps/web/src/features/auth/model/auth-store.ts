import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@saneatsu/schemas";

/**
 * 認証状態の型定義
 */
interface AuthState {
	/** 現在のユーザー情報 */
	user: PublicUser | null;
	/** ローディング状態 */
	isLoading: boolean;
	/** エラーメッセージ */
	error: string | null;
}

/**
 * 認証アクションの型定義
 */
interface AuthActions {
	/** ユーザー情報を設定 */
	setUser: (user: PublicUser | null) => void;
	/** ローディング状態を設定 */
	setLoading: (loading: boolean) => void;
	/** エラーメッセージを設定 */
	setError: (error: string | null) => void;
	/** ログイン処理 */
	login: (email: string, password: string) => Promise<void>;
	/** ユーザー登録処理 */
	register: (email: string, name: string, password: string) => Promise<void>;
	/** ログアウト処理 */
	logout: () => Promise<void>;
	/** 現在のユーザー情報を取得 */
	fetchCurrentUser: () => Promise<void>;
	/** パスワード変更処理 */
	changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
	/** 状態をリセット */
	reset: () => void;
}

/**
 * APIクライアント関数
 */
const apiClient = {
	/**
	 * ログインAPI呼び出し
	 */
	async login(email: string, password: string): Promise<PublicUser> {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "ログインに失敗しました");
		}

		const data = await response.json();
		return data.user;
	},

	/**
	 * ユーザー登録API呼び出し
	 */
	async register(email: string, name: string, password: string): Promise<PublicUser> {
		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, name, password, provider: "local" }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "ユーザー登録に失敗しました");
		}

		const data = await response.json();
		return data.user;
	},

	/**
	 * ログアウトAPI呼び出し
	 */
	async logout(): Promise<void> {
		const response = await fetch("/api/auth/logout", {
			method: "POST",
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "ログアウトに失敗しました");
		}
	},

	/**
	 * 現在のユーザー情報取得API呼び出し
	 */
	async getCurrentUser(): Promise<PublicUser> {
		const response = await fetch("/api/auth/me");

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error("UNAUTHORIZED");
			}
			const error = await response.json();
			throw new Error(error.error || "ユーザー情報の取得に失敗しました");
		}

		const data = await response.json();
		return data.user;
	},

	/**
	 * パスワード変更API呼び出し
	 */
	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		const response = await fetch("/api/auth/password", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ currentPassword, newPassword }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "パスワード変更に失敗しました");
		}
	},
};

/**
 * 認証状態管理ストア
 * 
 * ユーザーの認証状態、ログイン・ログアウト処理、
 * エラーハンドリングを管理する
 */
export const useAuthStore = create<AuthState & AuthActions>()(
	persist(
		(set, get) => ({
			// 初期状態
			user: null,
			isLoading: false,
			error: null,

			// アクション
			setUser: (user) => set({ user }),
			setLoading: (isLoading) => set({ isLoading }),
			setError: (error) => set({ error }),

			/**
			 * ログイン処理
			 * 1. ローディング開始
			 * 2. API呼び出し
			 * 3. ユーザー情報を設定
			 * 4. エラーハンドリング
			 */
			login: async (email, password) => {
				set({ isLoading: true, error: null });
				try {
					const user = await apiClient.login(email, password);
					set({ user, isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "ログインに失敗しました",
						isLoading: false,
					});
					throw error;
				}
			},

			/**
			 * ユーザー登録処理
			 * 1. ローディング開始
			 * 2. API呼び出し
			 * 3. ユーザー情報を設定
			 * 4. エラーハンドリング
			 */
			register: async (email, name, password) => {
				set({ isLoading: true, error: null });
				try {
					const user = await apiClient.register(email, name, password);
					set({ user, isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "ユーザー登録に失敗しました",
						isLoading: false,
					});
					throw error;
				}
			},

			/**
			 * ログアウト処理
			 * 1. ローディング開始
			 * 2. API呼び出し
			 * 3. ユーザー情報をクリア
			 * 4. エラーハンドリング
			 */
			logout: async () => {
				set({ isLoading: true, error: null });
				try {
					await apiClient.logout();
					set({ user: null, isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "ログアウトに失敗しました",
						isLoading: false,
					});
					throw error;
				}
			},

			/**
			 * 現在のユーザー情報取得処理
			 * 1. ローディング開始
			 * 2. API呼び出し
			 * 3. ユーザー情報を設定
			 * 4. 未認証の場合はユーザー情報をクリア
			 * 5. エラーハンドリング
			 */
			fetchCurrentUser: async () => {
				set({ isLoading: true, error: null });
				try {
					const user = await apiClient.getCurrentUser();
					set({ user, isLoading: false });
				} catch (error) {
					if (error instanceof Error && error.message === "UNAUTHORIZED") {
						set({ user: null, isLoading: false });
					} else {
						set({
							error:
								error instanceof Error
									? error.message
									: "ユーザー情報の取得に失敗しました",
							isLoading: false,
						});
					}
				}
			},

			/**
			 * パスワード変更処理
			 * 1. ローディング開始
			 * 2. API呼び出し
			 * 3. エラーハンドリング
			 */
			changePassword: async (currentPassword, newPassword) => {
				set({ isLoading: true, error: null });
				try {
					await apiClient.changePassword(currentPassword, newPassword);
					set({ isLoading: false });
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "パスワード変更に失敗しました",
						isLoading: false,
					});
					throw error;
				}
			},

			/**
			 * 状態をリセット
			 */
			reset: () => set({ user: null, isLoading: false, error: null }),
		}),
		{
			name: "auth-storage",
			// セキュリティのため、ユーザー情報のみを永続化
			partialize: (state) => ({ user: state.user }),
		}
	)
);