---
name: project-context
description: icarun の現在状況、未完了事項、architecture資料、API/AI contract を詳しく確認するときに使う。
---

# Project context

必要な情報だけを次の資料からlazy-loadする。

- `README.md`: 現在の全体像と開発手順
- `docs/api-contract.md`: Convex function contract
- `docs/ai-contract.md`: AI action schema と確認規則
- `docs/database.md`: schema、owner isolation、codegen policy
- `docs/deployment.md`: Railway topology とproduction設定
- `docs/security.md`: auth、secret、public/private network境界
- `docs/adr/0002-use-convex.md`: PostgreSQL / Express計画をConvexが置換した決定
- `memory-bank/activeContext.md`: 現在の作業焦点、open decisions、警告
- `memory-bank/progress.md`: 完了状況、残作業、known risks
- `memory-bank/systemPatterns.md`: architectureと重要な実装pattern
- `memory-bank/techContext.md`: toolchainとdeployment制約

大きなarchitecture、deployment、進捗変更を行った場合は、該当する `memory-bank/` のファイルを更新する。
