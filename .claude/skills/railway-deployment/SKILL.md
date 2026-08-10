---
name: railway-deployment
description: icarun の Railway 構成、環境変数、service lifecycle、deployment troubleshooting を扱うときに使う。
---

# Railway deployment

Railway 関連の作業では、最初に `docs/deployment.md` と対象serviceの `railway.json` を読む。

- 同一repositoryから `@icarun/mobile`、`@icarun/convex-backend`、`@icarun/convex-dashboard`、`@icarun/database` の4 serviceを配備し、Docker Composeは使わない。
- frontendはRailpack、他3 serviceは公式imageを包むDockerfile builder。
- frontend lifecycleは `pnpm railway:build:frontend`（Expo exportのみ）、`pnpm railway:deploy:frontend`（bounded wait、Convex function env同期、function deploy）、`pnpm railway:start:frontend`（deploy-only secret除去、SPA配信）。
- Self-hosted Convexは3210をAPI / websocket / functions、3211をHTTP actions / Better Authに使う。browser-facing URLは各公開originを指す。
- private Railway domainはbackend→PostgreSQLとfrontend pre-deploy→Convexだけに使う。
- Railway container envはConvex function envへ自動伝播しない。`CONVEX_ENV_*`の同期を維持する。
- serviceのwatch patternを変えるときは、そのserviceに影響する全root inputと`/.gitattributes`を含める。
- 詳細な変数、volume、timeout、bootstrap順序、smoke testは `docs/deployment.md` を正とする。
