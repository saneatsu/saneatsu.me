# ドメイン選定

## 会社名

株式会社Nito（「二兎追うものはイットも得ず」が由来）

## 調査済みドメイン一覧

### 取得不可（登録済み）

- nito.jp
- nito.co
- nito.com
- nito.app
- nito.io
- nito.org
- nito.dev
- nito.cc
- nito.co.jp
- nito.me
- nito.work
- nito.ai
- nito.so
- nito.global

### 取得可能

| ドメイン | 年間費用 | 備考 |
|---|---|---|
| `nito.company` | $16.20 | 「会社」。説明的だがメッセージ性がない |
| `nito.run` | $21.20 | 「走る・追う」。「二兎を追う」の由来と合う |
| `nito.ltd` | $24.20 | 「Limited」。英国式の会社表記 |
| `nito.build` | $25.20 | 「作る」。テック感あるが建設業向けTLD |
| `nito.land` | $32.20 | 「場所」。ホームページ感はあるがやや遊び心 |
| `nito.software` | $32.20 | ストレートだが長い |
| `nito.sh` | $45 | 短くてクールだがccTLD（セントヘレナ）リスクあり |
| `nito.codes` | $55.20 | 開発会社として直球だがやや高い |
| `nito.site` | $62.70 | 汎用的すぎる |
| `nito.space` | $62.70 | 汎用的すぎる |
| `nito.tech` | $500 | プレミアム価格。更新も年$500 |
| `nito.inc` | $2,000.20 | プレミアム価格 |

## 最終候補

| ドメイン | 年間費用 | 推奨理由 |
|---|---|---|
| `nito.run` | $21.20 | 「二兎を追って走る」。社名の由来とブランドストーリーが一貫する |
| `nito.build` | $25.20 | 「ものを作る会社」。テック企業として自然 |
| `nito.company` | $16.20 | 最安。意味が明確だがメッセージ性はない |

## 各サービスのID方針

ドメインに合わせてハイフンつなぎで統一する。

例: `nito.run` を選んだ場合
- GitHub: `nito-run`
- Vercel: `nito-run`
- X: `nito_run`

## サービス移行（個人 → 法人Organization）

### Turso

```bash
turso group transfer <group-name> <移動先organization名>
```

- 移動先Organizationのadminまたはownerである必要がある
- 既存のデータベースURLとトークンは一時的に動作する
- ただし、早めに新しいURLとトークンへ更新することが推奨されている

ソース:
- [Turso CLI - group transfer](https://docs.turso.tech/cli/group/transfer)
- [Transfer Group - API Reference](https://docs.turso.tech/api-reference/groups/transfer)

### Fly.io

```bash
fly apps move <app-name> --org <移動先organization名>
```

- 両方のOrganizationのメンバーである必要がある
- 自動で移動されるもの: Machines & Volumes（データ含む）、環境変数・シークレット、証明書・ドメイン、LiteFS
- 数分のダウンタイムが発生する
- Fly Postgresアプリは移動不可（新規作成 + データ復元が必要）
- Upstash for Redis、Tigris object storageは手動で再設定が必要

ソース:
- [Move an app between organizations - Fly Docs](https://fly.io/docs/apps/move-app-org/)
- [fly apps move - Fly Docs](https://fly.io/docs/flyctl/apps-move/)
