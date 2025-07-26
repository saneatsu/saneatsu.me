interface ArticlePageProps {
	params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
	const { slug } = await params;
	
	return (
		<div>
			<h1>Article: {slug}</h1>
			<p>Article detail view is temporarily disabled.</p>
		</div>
	);
}