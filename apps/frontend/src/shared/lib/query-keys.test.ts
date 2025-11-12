import { describe, expect, it } from "vitest";

import { queryKeys } from "./query-keys";

describe("queryKeys.article.all", () => {
	it("フィルター未指定なら基底キーのみを返す", () => {
		expect(queryKeys.article.all()).toEqual(["articles"]);
	});

	it("フィルターを指定するとキーにパラメータが付与される", () => {
		const filters = {
			status: ["draft"],
			page: 2,
			limit: 10,
			language: "ja",
			sortBy: "updatedAt",
			sortOrder: "desc",
		};

		expect(queryKeys.article.all(filters)).toEqual(["articles", filters]);
	});
});
