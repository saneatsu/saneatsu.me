"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../shared/ui/avatar/avatar";
import { Button } from "../../shared/ui/button/button";
import { Separator } from "../../shared/ui/separator/separator";

interface UserInfoProps {
	user:
		| {
				name?: string | null;
				email?: string | null;
				image?: string | null;
		  }
		| undefined;
}

export function UserInfo({ user }: UserInfoProps) {
	return (
		<div className="absolute bottom-0 w-64 p-6">
			<Separator className="mb-6" />
			<div className="flex items-center space-x-3">
				<Avatar className="w-10 h-10">
					{user?.image && (
						<AvatarImage src={user.image} alt={user.name || ""} />
					)}
					<AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-sm font-medium text-foreground">{user?.name}</p>
					<p className="text-xs text-muted-foreground">{user?.email}</p>
				</div>
			</div>
			<form action="/api/auth/signout" method="POST">
				<Button
					type="submit"
					variant="ghost"
					size="sm"
					className="mt-4 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
				>
					ログアウト
				</Button>
			</form>
		</div>
	);
}
