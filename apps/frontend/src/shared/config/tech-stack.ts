import { AWS, Playwright, Slack } from "developer-icons";
import type { ComponentType } from "react";
import type { SimpleIcon } from "simple-icons";
import {
	siAnaconda,
	siAsana,
	siBetterauth,
	siBiome,
	siCloudflare,
	siCss,
	siDart,
	siDependabot,
	siDjango,
	siDocker,
	siDotnet,
	siDrizzle,
	siExpo,
	siFastify,
	siFlask,
	siFlutter,
	siGit,
	siGithub,
	siGithubactions,
	siGooglebigquery,
	siGooglecloud,
	siHetzner,
	siHono,
	siHtml5,
	siJavascript,
	siKeras,
	siKonva,
	siLefthook,
	siMantine,
	siMeilisearch,
	siMui,
	siNextdotjs,
	siNodedotjs,
	siNotion,
	siNuxt,
	siOpencv,
	siPinia,
	siPostgresql,
	siPrettier,
	siPrimevue,
	siPrisma,
	siPython,
	siPytorch,
	siRadixui,
	siReact,
	siReacthookform,
	siRemix,
	siRubyonrails,
	siSass,
	siSelenium,
	siShadcnui,
	siSqlite,
	siStorybook,
	siStripe,
	siSupabase,
	siTailwindcss,
	siTanstack,
	siTensorflow,
	siTestinglibrary,
	siTurso,
	siTypescript,
	siVercel,
	siVite,
	siVitest,
	siVuedotjs,
	siVuetify,
	siXyflow,
	siZod,
} from "simple-icons";

/**
 * 技術スタックのカテゴリ
 *
 * @description
 * aboutページの技術スタックセクションで、技術をグルーピングするための分類。
 */
export type TechCategory = "languages" | "frameworks" | "databases" | "tools";

/**
 * 1つの技術のメタ情報
 *
 * @description
 * バッジ表示に必要な情報（アイコン・背景色）と、所属カテゴリを持つ。
 * アイコンは以下のいずれかで表現する。両方無い技術（例: Kysely）は背景色のみで表示する。
 * - `icon`: simple-icons の SimpleIcon（大多数はこちら）
 * - `renderIcon`: simple-icons に存在しない技術用の developer-icons 等の React コンポーネント
 */
export type TechMeta = {
	/** simple-iconsのアイコン（simple-iconsに存在する技術用） */
	icon?: SimpleIcon;
	/** developer-icons等のReactコンポーネントアイコン（simple-iconsに無い技術用） */
	renderIcon?: ComponentType<{ size?: number; className?: string }>;
	/** カスタム背景色（#付きのhex値。アイコンが無い、または固有色を持たせたい場合に指定） */
	backgroundColor?: string;
	/** 所属カテゴリ */
	category: TechCategory;
};

/**
 * 技術スタックの単一の信頼できる情報源（Single Source of Truth）
 *
 * @description
 * サイト内で扱う全技術の「名前 → メタ情報（アイコン・背景色・カテゴリ）」を集約した唯一の定義。
 *
 * ここに1エントリ追加するだけで、以下がすべて自動的に追随する。
 * 1. `TechStackName` 型（許可される技術名）に名前が追加される
 * 2. aboutページの技術スタックセクション（`about-view.tsx`）に該当カテゴリで表示される
 * 3. 経歴詳細の `techStack`（`get-tech-icon.ts` の `getTechIcon` / `getTechMeta`）で解決できる
 *
 * 【なぜSSOTにするか】
 * 以前は「表示用（about-view）」「文字列解決用（get-tech-icon）」「型（timeline）」の3箇所に
 * 技術情報が分散し、片方に足してもう片方に足し忘れると、経歴詳細で頭文字フォールバック
 * （例: 「R」）になったり、セクションと詳細で表示が食い違ったりしていた。1箇所に集約することで
 * この不整合を構造的に防ぐ。
 *
 * オブジェクトのキー順が、aboutページでの表示順になる（カテゴリごとに挿入順で並ぶ）。
 */
export const TECH_STACK = {
	// Languages
	TypeScript: { icon: siTypescript, category: "languages" },
	JavaScript: { icon: siJavascript, category: "languages" },
	Python: { icon: siPython, category: "languages" },
	Dart: { icon: siDart, category: "languages" },
	HTML5: { icon: siHtml5, category: "languages" },
	CSS: { icon: siCss, category: "languages" },
	"Visual Basic": { icon: siDotnet, category: "languages" },
	// VBAは.NETの一部として扱う
	VBA: { icon: siDotnet, category: "languages" },

	// Frameworks & Libraries
	React: { icon: siReact, category: "frameworks" },
	"Next.js": { icon: siNextdotjs, category: "frameworks" },
	"Vue.js": { icon: siVuedotjs, category: "frameworks" },
	Nuxt: { icon: siNuxt, category: "frameworks" },
	Remix: { icon: siRemix, category: "frameworks" },
	"React Native": { icon: siReact, category: "frameworks" },
	Expo: { icon: siExpo, category: "frameworks" },
	NativeWind: { icon: siTailwindcss, category: "frameworks" },
	Flutter: { icon: siFlutter, category: "frameworks" },
	Rails: { icon: siRubyonrails, category: "frameworks" },
	Sass: { icon: siSass, category: "frameworks" },
	"Tailwind CSS": { icon: siTailwindcss, category: "frameworks" },
	MUI: { icon: siMui, category: "frameworks" },
	Vuetify: { icon: siVuetify, category: "frameworks" },
	"Radix UI": { icon: siRadixui, category: "frameworks" },
	"shadcn/ui": { icon: siShadcnui, category: "frameworks" },
	Mantine: { icon: siMantine, category: "frameworks" },
	PrimeVue: { icon: siPrimevue, category: "frameworks" },
	Pinia: { icon: siPinia, category: "frameworks" },
	"Node.js": { icon: siNodedotjs, category: "frameworks" },
	Hono: { icon: siHono, category: "frameworks" },
	Fastify: { icon: siFastify, category: "frameworks" },
	Flask: { icon: siFlask, category: "frameworks" },
	Django: { icon: siDjango, category: "frameworks" },
	PyTorch: { icon: siPytorch, category: "frameworks" },
	TensorFlow: { icon: siTensorflow, category: "frameworks" },
	Keras: { icon: siKeras, category: "frameworks" },
	OpenCV: { icon: siOpencv, category: "frameworks" },
	Vite: { icon: siVite, category: "frameworks" },
	Vitest: { icon: siVitest, category: "frameworks" },
	"Testing Library": { icon: siTestinglibrary, category: "frameworks" },
	Storybook: { icon: siStorybook, category: "frameworks" },
	// Playwright: simple-iconsに無いためdeveloper-iconsのコンポーネントを使用
	Playwright: {
		renderIcon: Playwright,
		backgroundColor: "#4E6D82",
		category: "frameworks",
	},
	Selenium: { icon: siSelenium, category: "frameworks" },
	TanStack: { icon: siTanstack, category: "frameworks" },
	// Kysely: 専用アイコンが無いため背景色のみで表示
	Kysely: { backgroundColor: "#7CE2FE", category: "frameworks" },
	"Drizzle ORM": { icon: siDrizzle, category: "frameworks" },
	Prisma: { icon: siPrisma, category: "frameworks" },
	"Better Auth": { icon: siBetterauth, category: "frameworks" },
	Zod: { icon: siZod, category: "frameworks" },
	"React Hook Form": { icon: siReacthookform, category: "frameworks" },
	"React Flow": { icon: siXyflow, category: "frameworks" },
	Konva: { icon: siKonva, category: "frameworks" },
	Lefthook: { icon: siLefthook, category: "frameworks" },
	Biome: { icon: siBiome, category: "frameworks" },
	Prettier: { icon: siPrettier, category: "frameworks" },

	// Databases
	PostgreSQL: { icon: siPostgresql, category: "databases" },
	SQLite: { icon: siSqlite, category: "databases" },
	Supabase: { icon: siSupabase, category: "databases" },
	Turso: { icon: siTurso, category: "databases" },
	BigQuery: { icon: siGooglebigquery, category: "databases" },
	Meilisearch: { icon: siMeilisearch, category: "databases" },

	// Tools & Services
	Git: { icon: siGit, category: "tools" },
	GitHub: { icon: siGithub, category: "tools" },
	"GitHub Actions": { icon: siGithubactions, category: "tools" },
	Vercel: { icon: siVercel, category: "tools" },
	Cloudflare: { icon: siCloudflare, category: "tools" },
	Hetzner: { icon: siHetzner, category: "tools" },
	// AWS: simple-iconsに無いためdeveloper-iconsのコンポーネントを使用
	AWS: { renderIcon: AWS, backgroundColor: "#E8EAED", category: "tools" },
	"Google Cloud": { icon: siGooglecloud, category: "tools" },
	Docker: { icon: siDocker, category: "tools" },
	Anaconda: { icon: siAnaconda, category: "tools" },
	Notion: { icon: siNotion, category: "tools" },
	Slack: { renderIcon: Slack, backgroundColor: "#4A154B", category: "tools" },
	Stripe: { icon: siStripe, category: "tools" },
	Asana: { icon: siAsana, category: "tools" },
	Dependabot: { icon: siDependabot, category: "tools" },
} satisfies Record<string, TechMeta>;

/**
 * 技術スタック名のユニオン型
 *
 * @description
 * `TECH_STACK` のキーから導出されたリテラル型。
 * 経歴の `techStack` フィールド（`TimelineItemDescription.techStack`）に使用することで、
 * SSOTに存在しない技術名を型レベルで弾き、表示との整合性を担保する。
 */
export type TechStackName = keyof typeof TECH_STACK;

/**
 * 技術スタック名の一覧（実行時に参照可能な配列）
 *
 * @description
 * `TECH_STACK` のキーを配列化したもの。型 `TechStackName` の実行時版。
 */
export const TECH_STACK_NAMES = Object.keys(TECH_STACK) as TechStackName[];

/**
 * 指定カテゴリに属する技術の一覧を、表示順（定義順）で取得する
 *
 * @description
 * `TECH_STACK` の定義順を保ったまま、該当カテゴリの技術を名前付きで返す。
 * aboutページの技術スタックセクションで、カテゴリごとのバッジ一覧を生成するために使う。
 *
 * @param category - 取得するカテゴリ
 * @returns `{ name, ...メタ情報 }` の配列（定義順）
 */
export function techStackByCategory(
	category: TechCategory
): Array<{ name: TechStackName } & TechMeta> {
	return (Object.entries(TECH_STACK) as Array<[TechStackName, TechMeta]>)
		.filter(([, meta]) => meta.category === category)
		.map(([name, meta]) => ({ name, ...meta }));
}
