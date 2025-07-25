import jaMessages from "@saneatsu/i18n/src/locales/ja.json";
import type { Preview } from "@storybook/nextjs";
import { NextIntlClientProvider } from "next-intl";

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
			<NextIntlClientProvider locale="ja" messages={jaMessages}>
				<Story />
			</NextIntlClientProvider>
		),
	],
};

export default preview;
