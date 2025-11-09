"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { GoogleLogo } from "@/shared/image";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/ui";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");

	const handleGoogleSignIn = () => {
		signIn("google", { callbackUrl: "/admin" });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">管理者ログイン</CardTitle>
					<p className="text-muted-foreground text-sm">
						Google アカウントでログインしてください
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>
								{error === "AccessDenied"
									? "アクセスが拒否されました。管理者権限が必要です。"
									: "ログインに失敗しました。もう一度お試しください。"}
							</AlertDescription>
						</Alert>
					)}
					<Button
						type="button"
						onClick={handleGoogleSignIn}
						variant="outline"
						size="lg"
						className="w-full"
					>
						<GoogleLogo className="w-5 h-5 mr-2" />
						Google でログイン
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
