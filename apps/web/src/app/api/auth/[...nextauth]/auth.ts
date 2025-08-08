import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdminEmail } from "../../../../shared/config/admin";
import { upsertUser } from "../../../../shared/lib/api-client";

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
					// 管理者権限チェック（フロント側でも事前チェック）
					if (!isAdminEmail(profile.email)) {
						console.log(`Unauthorized access attempt: ${profile.email}`);
						return false; // 管理者でない場合は認証拒否
					}

					// Backend APIを呼び出してユーザー情報を保存
					// ビルド時はAPI URLが設定されていない場合があるのでスキップ
					if (process.env.NEXT_PUBLIC_API_URL) {
						try {
							await upsertUser({
								email: profile.email,
								name: profile.name || user.name || "Unknown",
								picture: profile.picture || user.image,
								sub: profile.sub || account.providerAccountId,
							});
						} catch (error) {
							// APIエラーが403（Forbidden）の場合は認証拒否
							if (
								error instanceof Error &&
								"status" in error &&
								error.status === 403
							) {
								console.log(
									`Backend rejected authentication for: ${profile.email}`
								);
								return false;
							}
							// その他のエラーはログを出すが認証は続行
							console.error("Failed to save user via API:", error);
						}
					} else {
						console.warn("API operations skipped during build/development");
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
