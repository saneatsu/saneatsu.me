import { ArticlesList } from "../../../widgets/articles-list";

/**
 * ホームページのメインビューコンポーネント
 *
 * @description
 * ブログのホームページを表示するビューコンポーネント。
 * ヒーローセクションと記事一覧を含む。
 */
export function HomeView() {
	return (
		<main className="container mx-auto px-4 py-8 space-y-12">
			{/* Hero Section */}
			<section className="text-center space-y-4">
				<h1 className="text-4xl font-bold">Saneatsu Blog</h1>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					技術とライフスタイルに関する記事を発信しています。プログラミング、開発ツール、日常の気づきなど、さまざまなトピックを扱います。
				</p>
			</section>

			{/* Articles Section */}
			<section>
				<ArticlesList />
			</section>
		</main>
	);
}
