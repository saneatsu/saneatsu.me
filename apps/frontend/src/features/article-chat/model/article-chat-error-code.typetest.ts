/**
 * 記事チャットエラーコードとi18n翻訳キーの整合性を検証する型テスト
 *
 * このファイルは実行されることはなく、`pnpm type-check` 時にのみ検証される。
 * エラーコードの追加・削除時に翻訳JSONへの反映漏れがあるとコンパイルエラーになる。
 */
import type { en, ja } from "@saneatsu/i18n";

import type { ArticleChatErrorCode } from "./article-chat-error-code";

/** i18nのarticleChat.error以下のキーを抽出 */
type JaErrorKeys = keyof (typeof ja)["articleChat"]["error"];
type EnErrorKeys = keyof (typeof en)["articleChat"]["error"];

/** never以外の型が渡された場合にコンパイルエラーを発生させるユーティリティ型 */
type AssertNever<T extends never> = T;

/**
 * エラーコードのうちi18n翻訳キーに存在しないものを抽出する型
 * 全エラーコードが翻訳キーに含まれていれば never になり、AssertNever を通過する。
 * 不足があれば never 以外の型になり、コンパイルエラーが発生する。
 */
type MissingInJa = Exclude<ArticleChatErrorCode, JaErrorKeys>;
type MissingInEn = Exclude<ArticleChatErrorCode, EnErrorKeys>;

/** コンパイル時検証用 — エラーコードに対応する翻訳キーが不足していればコンパイルエラーになる */
export type _VerifyJa = AssertNever<MissingInJa>;
export type _VerifyEn = AssertNever<MissingInEn>;
