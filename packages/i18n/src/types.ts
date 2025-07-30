/**
 * 翻訳メッセージの型定義
 */

export interface CommonMessages {
	navigation: {
		home: string;
		blog: string;
		about: string;
		tags: string;
	};
	theme: {
		light: string;
		dark: string;
		system: string;
		toggle: string;
	};
	language: {
		japanese: string;
		english: string;
		switch: string;
	};
	loading: string;
	error: {
		title: string;
		message: string;
		retry: string;
		goHome: string;
	};
}

export interface ArticleMessages {
	publishedAt: string;
	readMore: string;
	backToList: string;
	notFound: {
		title: string;
		message: string;
	};
}


export interface Messages extends CommonMessages {
	article: ArticleMessages;
}
