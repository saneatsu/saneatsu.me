import { Providers } from "./providers";
import "./globals.css";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
