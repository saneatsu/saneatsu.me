import type {
	DefaultOptions,
	UseMutationOptions,
	UseQueryOptions,
} from "@tanstack/react-query";

/**
 * React Queryのデフォルト設定
 */
export const queryConfig = {
	queries: {
		// throwOnError: true,
		refetchOnWindowFocus: false,
		retry: false,
		staleTime: 60 * 1000, // 1分間はデータを新鮮とみなす
	},
} satisfies DefaultOptions;

/**
 * useQuery用の型定義
 * queryKeyとqueryFnを除いたオプションを受け取る
 */
export type QueryConfig<
	// biome-ignore lint/suspicious/noExplicitAny: 汎用的な関数型を受け入れるための型パラメータ
	T extends (...args: any[]) => any,
	TData = Awaited<ReturnType<T>>,
> = Omit<
	UseQueryOptions<Awaited<ReturnType<T>>, Error, TData>,
	"queryKey" | "queryFn"
>;

/**
 * API関数の戻り値型を取得するユーティリティ型
 */
// biome-ignore lint/suspicious/noExplicitAny: 汎用的な関数型を受け入れるための型パラメータ
export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> =
	Awaited<ReturnType<FnType>>;

/**
 * useMutation用の型定義
 * mutationFnを除いたオプションを受け取る
 */
export type MutationConfig<
	// biome-ignore lint/suspicious/noExplicitAny: 汎用的な関数型を受け入れるための型パラメータ
	MutationFnType extends (...args: any) => Promise<any>,
> = UseMutationOptions<
	ApiFnReturnType<MutationFnType>,
	Error,
	Parameters<MutationFnType>[0]
>;