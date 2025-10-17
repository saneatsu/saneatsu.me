import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { isAdminEmail } from "@/shared/config/admin";
import { upsertUser } from "@/shared/lib";

export const authOptions: any = {
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
	cookies: {
		sessionToken: {
			name:
				process.env.NODE_ENV === "production"
					? "__Secure-authjs.session-token"
					: "authjs.session-token",
			options: {
				httpOnly: true,
				sameSite: "lax" as const,
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
	},
	callbacks: {
		async signIn(params: any) {
			const { user, account, profile } = params;

			// 🐛 DEBUG: 受け取った認証情報をログ出力
			console.log("🔍 NextAuth signIn callback:", {
				provider: account?.provider,
				userEmail: profile?.email || user?.email,
				userName: profile?.name || user?.name,
				accountType: account?.type,
			});

			// 🐛 DEBUG: 環境変数をログ出力
			console.log("🔍 Environment variables:", {
				ADMIN_EMAILS: process.env.ADMIN_EMAILS,
				NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
				NODE_ENV: process.env.NODE_ENV,
			});

			try {
				// Google認証の場合のみ処理
				if (account?.provider === "google" && profile?.email) {
					// 🐛 DEBUG: 管理者権限チェック前
					const isAdmin = isAdminEmail(profile.email);
					console.log("🔍 Admin check result:", {
						email: profile.email,
						isAdmin: isAdmin,
						allowedEmails: process.env.ADMIN_EMAILS?.split(",").map((e) =>
							e.trim()
						),
					});

					// 管理者権限チェック（フロント側でも事前チェック）
					if (!isAdmin) {
						console.error("❌ Unauthorized access attempt:", profile.email);
						return false; // 管理者でない場合は認証拒否
					}

					console.log("✅ Admin authentication approved for:", profile.email);

					// Backend APIを呼び出してユーザー情報を保存
					// ビルド時はAPI URLが設定されていない場合があるのでスキップ
					console.log("🔍 API URL configuration:", {
						NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
						hasURL: !!process.env.NEXT_PUBLIC_API_URL,
					});

					if (process.env.NEXT_PUBLIC_API_URL) {
						console.log("🔍 Attempting API call to upsertUser...");
						try {
							const userData = {
								email: profile.email,
								name: profile.name || user.name || "Unknown",
								picture: profile.picture || user.image,
								sub: profile.sub || account.providerAccountId,
							};
							console.log("🔍 API call data:", userData);

							const apiResponse = await upsertUser(userData);
							console.log("✅ API call successful:", {
								response: apiResponse,
								userData: userData,
							});
						} catch (error) {
							console.error("🔍 API call error details:", {
								error: error,
								message:
									error instanceof Error ? error.message : "Unknown error",
								status:
									error && typeof error === "object" && "status" in error
										? (error as any).status
										: "No status",
								stack: error instanceof Error ? error.stack : "No stack",
							});

							// APIエラーが403（Forbidden）の場合は認証拒否
							if (
								error &&
								typeof error === "object" &&
								"status" in error &&
								(error as any).status === 403
							) {
								console.error(
									`❌ Backend rejected authentication (403) for: ${profile.email}`
								);
								return false;
							}
							// その他のエラーはログを出すが認証は続行
							console.error("⚠️ API error but continuing auth:", error);
						}
					} else {
						console.warn("⚠️ API operations skipped - no NEXT_PUBLIC_API_URL");
					}
				} else {
					console.log(
						"🔍 Non-Google provider or missing email, skipping custom logic"
					);
				}

				console.log(
					"✅ SignIn callback completed successfully - RETURNING TRUE"
				);
				const finalResult = true;
				console.log("🔍 Final signIn result:", finalResult);
				return finalResult;
			} catch (error) {
				console.error("❌ Critical error in signIn callback:", error);
				return false; // 認証失敗
			}
		},
		async jwt(params: any) {
			const { token, user } = params;
			console.log("🔍 JWT callback called:", {
				hasUser: !!user,
				userInfo: user
					? {
							id: user.id,
							email: user.email,
							name: user.name,
							image: user.image,
						}
					: null,
				currentToken: {
					id: token.id,
					email: token.email,
					name: token.name,
					picture: token.picture,
				},
			});

			// 初回ログイン時にユーザー情報をトークンに追加
			if (user) {
				token.id = user.id || "";
				token.email = user.email || "";
				token.name = user.name || "";
				token.picture = user.image || "";
				console.log("✅ JWT token updated:", {
					id: token.id,
					email: token.email,
					name: token.name,
					picture: token.picture,
				});
			}
			return token;
		},
		async session(params: any) {
			const { session, token } = params;
			console.log("🔍 Session callback called:", {
				hasToken: !!token,
				hasSession: !!session,
				hasUser: !!session?.user,
				tokenInfo: token
					? {
							id: token.id,
							email: token.email,
							name: token.name,
							picture: token.picture,
						}
					: null,
				sessionInfo: session
					? {
							user: session.user,
							expires: session.expires,
						}
					: null,
			});

			// JWTトークンからセッション情報を構築
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string;
				session.user.image = token.picture as string;
				console.log("✅ Session constructed:", {
					userId: session.user.id,
					userEmail: session.user.email,
					userName: session.user.name,
					userImage: session.user.image,
				});
			} else {
				console.error("❌ Session construction failed:", {
					hasToken: !!token,
					hasSessionUser: !!session?.user,
				});
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

const nextAuth = NextAuth(authOptions);

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
