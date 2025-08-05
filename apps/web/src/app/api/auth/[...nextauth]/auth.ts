import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Account, Profile, Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdminEmail } from "../../../../shared/config/admin";
import { createDbClient } from "../../../../shared/lib/db";
import { upsertUserFromGoogle } from "../../../../shared/services/auth";

export const authOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
	session: {
		strategy: "jwt" as const,
		maxAge: 30 * 24 * 60 * 60, // 30日間
	},
	callbacks: {
		async signIn(params: any) {
			const { user, account, profile } = params;
			try {
				// Google認証の場合のみ処理
				if (account?.provider === "google" && profile?.email) {
					// 管理者権限チェック
					if (!isAdminEmail(profile.email)) {
						console.log(`Unauthorized access attempt: ${profile.email}`);
						return false; // 管理者でない場合は認証拒否
					}

					// ビルド時やテスト時は環境変数がない場合があるのでスキップ
					if (
						process.env.NODE_ENV === "production" ||
						process.env.TURSO_DATABASE_URL
					) {
						const db = createDbClient();
						await upsertUserFromGoogle(db, {
							email: profile.email,
							name: profile.name || user.name || "Unknown",
							picture: profile.picture || user.image,
							sub: profile.sub || account.providerAccountId,
						});
					} else {
						console.warn(
							"Database operations skipped during build/development"
						);
					}
				}
				return true;
			} catch (error) {
				console.error("Error saving user to database:", error);
				return false; // 認証失敗
			}
		},
		async jwt(params: any) {
			const { token, user } = params;
			// 初回ログイン時にユーザー情報をトークンに追加
			if (user) {
				token.id = user.id || "";
				token.email = user.email || "";
				token.name = user.name || "";
				token.picture = user.image || "";
			}
			return token;
		},
		async session(params: any) {
			const { session, token } = params;
			// JWTトークンからセッション情報を構築
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string;
				session.user.image = token.picture as string;
			}
			return session;
		},
	},
	pages: {
		signIn: "/login",
		error: "/login?error=auth",
	},
	secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
