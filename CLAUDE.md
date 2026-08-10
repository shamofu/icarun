# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常時適用する制約

- Node.js 22.x と pnpm 9 以上 12 未満を使用する。npm / yarn は使わない。
- Railway 互換性のため、ルート `package.json` に `packageManager` や pnpm 11 の `devEngines.packageManager` を再追加しない。
- lint / test / 単一テストのプロジェクト用コマンドは未定義。依存パッケージ内のテストをプロジェクトテストとして扱わない。
- 通常の変更後は `pnpm typecheck` と `pnpm build` を実行する。Convex schema、関数、auth component 設定を変更した場合は `pnpm convex:dev` も実行し、`apps/mobile/convex/_generated/` を再生成する。
- `apps/mobile/app/_layout.tsx` は auth loading 中も navigator を常時 mount し、`Stack.Protected` で route を切り替える。deep link と初期 navigation を壊さないため、この構造と `ConvexReactClient` の `expectAuth: true` を維持する。
- server state は Convex hooks で扱い、別の server-state library や不要な global state を追加しない。
- Metro + `web.output: "single"` とホスト側の `index.html` SPA fallback を維持する。runtime route `/tasks/[id]` があるため static output に変更しない。
- task / AI 関数は認証と owner scope を維持する。update / delete は ownership を確認し、`ownerId` のない認証前 task は意図的に不可視のままにする。
- Better Auth component の生成 table を手編集しない。
- application code から PostgreSQL に接続しない。PostgreSQL は self-hosted Convex の内部 persistence に限る。Drizzle、drizzle-kit、Prisma、SQL migration、Express を導入しない。
- AI は database を直接変更しない。`preview → JSON parse / Zod validation → user confirmation → execute → owner-scoped mutation` を保つ。許可 action は `create_task`、`update_task`、`delete_task`、`summarize_tasks` のみで、AI生成SQLや未検証の部分実行を禁止する。
- Railway では Docker Compose を使わず、各 `railway.json` は一つの service だけを設定する。watch pattern は全root inputを含め、`.gitattributes` の監視を維持する。
- browser-facing Convex URL は公開origin（3210: API、3211: HTTP actions / Better Auth）を使う。Railway private domain は backend→PostgreSQL と frontend pre-deploy→Convex だけに使う。
- Railway の container env は Convex function env に自動伝播しない。frontend pre-deploy の `CONVEX_ENV_*` 同期と、start時のdeploy-only credential除去を維持する。
- Expo client が参照できる環境変数は frontend-safe な `EXPO_PUBLIC_*` に限る。`OPENAI_*`、`BETTER_AUTH_SECRET`、`CONVEX_SELF_HOSTED_ADMIN_KEY`、`INSTANCE_SECRET`、`POSTGRES_*` をbundleへ入れない。
- `apps/mobile/convex/_generated/` はcommit対象。`apps/mobile/.convex/`、`apps/mobile/.env.local`、private `.env*` はcommitしない。
- 大きなarchitecture、deployment、進捗変更では対応する `memory-bank/` を更新する。
- `.clinerules/` にはBetter Auth導入前の古い記述がある。競合時は現在の実装、README、`docs/`、`memory-bank/activeContext.md` を優先する。
