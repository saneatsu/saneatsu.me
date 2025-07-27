"use client";

import { LogOut, Moon, Palette, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../shared/ui/avatar/avatar";
import { Button } from "../../shared/ui/button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../../shared/ui/dropdown-menu/dropdown-menu";
import { useSidebar } from "../../shared/ui/sidebar/sidebar";

interface UserInfoProps {
	user:
		| {
				name?: string | null;
				email?: string | null;
				image?: string | null;
		  }
		| undefined;
}

const themeOptions = [
	{ value: "light", label: "ライト", icon: Sun },
	{ value: "dark", label: "ダーク", icon: Moon },
	{ value: "system", label: "システム", icon: SunMoon },
];

export function UserInfo({ user }: UserInfoProps) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const { isMobile } = useSidebar();

	// next-themesはクライアントサイドでのみ動作するため、マウント後に使用
	useEffect(() => setMounted(true), []);

	// 現在のテーマ値を安全に取得
	const currentTheme = mounted ? theme : "system";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="w-full justify-start p-2 h-auto gap-2"
				>
					<Avatar className="h-8 w-8">
						{user?.image && (
							<AvatarImage src={user.image} alt={user.name || ""} />
						)}
						<AvatarFallback className="text-xs">
							{user?.name?.[0] || "U"}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-start text-left min-w-0 flex-1">
						<p className="text-sm font-medium text-foreground truncate w-full">
							{user?.name}
						</p>
						<p className="text-xs text-muted-foreground truncate w-full">
							{user?.email}
						</p>
					</div>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-56"
				align={isMobile ? "center" : "end"}
				side={isMobile ? "top" : "right"}
			>
				<DropdownMenuLabel className="flex flex-col space-y-1">
					<span>{user?.name}</span>
					<span className="text-xs font-normal text-muted-foreground">
						{user?.email}
					</span>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Palette className="mr-2 h-4 w-4" />
						<span>テーマ</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={currentTheme}
								onValueChange={setTheme}
							>
								{themeOptions.map((option) => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}
										className="cursor-pointer"
									>
										<option.icon className="mr-2 h-4 w-4" />
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<form action="/api/auth/signout" method="POST" className="w-full">
						<Button
							type="submit"
							variant="ghost"
							size="sm"
							className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-normal"
						>
							<LogOut className="mr-2 h-4 w-4" />
							ログアウト
						</Button>
					</form>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
