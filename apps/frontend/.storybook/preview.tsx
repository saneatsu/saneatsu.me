import jaMessages from "@saneatsu/i18n/src/locales/ja.json";
import type { Preview } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initialize, mswLoader } from "msw-storybook-addon";
import { NextIntlClientProvider } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "../src/app/globals.css";

// MSWを初期化
initialize();

// React Queryクライアントをstorybook用に設定
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false, // Storybookでのテスト時はリトライしない
			staleTime: 0, // 常に新しいデータを取得
			gcTime: 0, // キャッシュを即座に削除
		},
	},
});

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		(Story) => (
			<NuqsAdapter>
				<QueryClientProvider client={queryClient}>
					<NextIntlClientProvider locale="ja" messages={jaMessages}>
						<Story />
					</NextIntlClientProvider>
				</QueryClientProvider>
			</NuqsAdapter>
		),
	],
	// MSWローダーを追加
	loaders: [mswLoader],
};

export default preview;
