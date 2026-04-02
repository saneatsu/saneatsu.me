import type { routing } from "@/shared/config/routing";

// next-intl の useLocale() が string ではなく Locale（"ja" | "en"）を返すようにする
// これにより useLocale() の戻り値に対する as キャストが不要になる
// @see https://next-intl.dev/docs/workflows/typescript
declare module "next-intl" {
	interface AppConfig {
		Locale: (typeof routing.locales)[number];
	}
}
