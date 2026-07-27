import type { AppType } from "@saneatsu/backend";
import type { hc } from "hono/client";

/**
 * 型導出専用の Hono クライアント型
 *
 * @description
 * API のリクエスト/レスポンス型を `InferResponseType` / `InferRequestType` で
 * バックエンドの `AppType` から導出するために使う。実行時には使用しない型専用モジュール。
 * 実際のクライアント生成は `use-client.ts` の `useHonoClient` を使うこと。
 */
export type ApiClient = ReturnType<typeof hc<AppType>>;
