"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "../button/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";

export type Theme = "light" | "dark" | "system";

export const isTheme = (value: unknown): value is Theme => {
	return value === "light" || value === "dark" || value === "system";
};

export type ThemeOption = {
	label: string;
	value: Theme;
	icon: React.ReactNode;
};

export const themeOptions: ThemeOption[] = [
	{ label: "Light", value: "light", icon: <Sun className="h-4 w-4" /> },
	{ label: "Dark", value: "dark", icon: <Moon className="h-4 w-4" /> },
	{
		label: "System",
		value: "system",
		icon: <Laptop className="h-4 w-4" />,
	},
];

export function ThemeSelector() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// next-themes only works on the client side,
	// so only use theme information after mounting
	useEffect(() => {
		setMounted(true);
	}, []);

	// Determine icon based on current theme
	const currentIcon = () => {
		if (!mounted) return <Sun className="h-4 w-4" />;

		switch (theme) {
			case "dark":
				return <Moon className="h-4 w-4" />;
			case "light":
				return <Sun className="h-4 w-4" />;
			default:
				return <Laptop className="h-4 w-4" />;
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Show theme options">
					{currentIcon()}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-36">
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) => {
						if (isTheme(value)) {
							setTheme(value);
						}
					}}
				>
					{themeOptions.map((option) => (
						<DropdownMenuRadioItem
							key={option.value}
							value={option.value}
							className="cursor-pointer flex items-center"
						>
							<span className="mr-2">{option.icon}</span>
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
