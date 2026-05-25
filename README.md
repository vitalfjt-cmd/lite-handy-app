# Lite Handy App

Lite のハンディ（スタッフ用）特化バージョンです。

## 特徴
- **Handy 注文特化:** 顧客用の Mobile/Tablet 注文画面を削除し、スタッフによる注文入力（ハンディ機能）をメインとしています。
- **軽量化:** 不要な顧客用コンポーネントやロジックを排除しています。

## 画面一覧
- `staff`: 伝票一覧 / ハンディ注文入力 / 修正 / 会計補助
- `kds`: 調理キュー（ハンディと連携）
- `admin`: メニュー / スタッフ管理等（管理者用）
- `setup`: 端末の初期設定（ハンディ、KDS、Adminの役割選択）

- **Staff / KDS 画面 (ログイン必須):**
  - URL: http://localhost:5173/?view=staff (または `/?view=kds`)
  - e-mail: `owner@example.com`
  - password: `demo1234`

## Playwright

1 台のローカル PC 上で `Customer 複数コンテキスト + Staff/KDS 補助` を回すための最小土台を追加しています。

セットアップ:

```bash
npm install
```

実行前に `.env.playwright.example` を元に環境変数を設定してください。

最低限必要:
- `PW_CUSTOMER_STORE`
- `PW_CUSTOMER_QR`

任意:
- `PW_CUSTOMER_CONTEXTS=4`
- `PW_STAFF_EMAIL` / `PW_STAFF_PASSWORD`
- `PW_KDS_EMAIL` / `PW_KDS_PASSWORD`
- `PW_STAFF_STORAGE_STATE_PATH`
- `PW_KDS_STORAGE_STATE_PATH`
- `PW_EXERCISE_ORDER_FLOW=1`
- `PW_CUSTOMER_ORDER_ITEM_NAME`

実行:

```bash
npm run test:e2e:foundation
```

補足:
- 既定では複数 Customer コンテキストの表示確認だけを行い、実注文は送りません
- 実注文を含める場合だけ `PW_EXERCISE_ORDER_FLOW=1` を付けます
- UI には `data-testid` を追加してあるので、今後シナリオを増やしやすい構成です

## Playwright Load Notes

Additional lightweight order-wave env vars:

- `PW_CUSTOMER_ORDER_CONTEXTS`
- `PW_CUSTOMER_ORDERS_PER_CONTEXT`
- `PW_ORDER_STAGGER_MS`

Example:

```bash
PW_CUSTOMER_CONTEXTS=6 \
PW_CUSTOMER_ORDER_CONTEXTS=4 \
PW_CUSTOMER_ORDERS_PER_CONTEXT=2 \
PW_ORDER_STAGGER_MS=500 \
PW_EXERCISE_ORDER_FLOW=1 \
npm run test:e2e:foundation
```

Saved metrics can be summarized with:

```bash
npm run test:e2e:metrics
```

Repeated samples can be run and classified with:

```bash
npm run test:e2e:samples -- --runs 10
```

Cleanup for accumulated KDS / Staff tickets:

```bash
npm run test:e2e:cleanup
```

Dry-run only:

```bash
npm run test:e2e:cleanup -- --dry-run
```

Optional:

- `node tests/e2e/support/summarize-load-metrics.mjs --limit 10`
- `node tests/e2e/support/summarize-load-metrics.mjs --file tests/e2e/artifacts/load-metrics.jsonl`
- `node tests/e2e/support/summarize-load-metrics.mjs --scenario 12c/8o/3x/100ms`
- `node tests/e2e/support/run-load-samples.mjs --runs 10 --output tests/e2e/artifacts/load-run-results.jsonl`
