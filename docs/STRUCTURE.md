# プロジェクト構成 (STRUCTURE)

## 1. ディレクトリ構造
```text
lite-handy-app/
├── android/            # Android ネイティブプロジェクト (Capacitor)
├── ios/                # iOS ネイティブプロジェクト (Capacitor)
├── docs/               # 仕様書および構成ドキュメント
├── figma-mocks/        # UIデザインモック
├── public/             # 静的アセット (ロゴ、ファビコン等)
├── tests/              # Playwright E2E テストおよびサポートスクリプト
├── capacitor.config.ts # Capacitor プラットフォーム設定
└── src/
    ├── components/     # 再利用可能な共通 UI コンポーネント
    │   ├── AppLauncher.tsx   # 全体ナビゲーション・ランチャーモーダル
    │   ├── AppSidebar.tsx    # トップナビゲーションバー
    │   ├── TableQrModal.tsx  # 卓番QR表示モーダル
    │   └── ToppingModal.tsx  # トッピング選択モーダル
    ├── data/           # 定数および初期データ
    ├── hooks/          # ドメイン・UI ロジックを分離したカスタムフック群
    │   ├── useAdminForm.ts       # マスタ管理のフォーム状態管理
    │   ├── useAdminOperations.ts # マスタ管理の CRUD ミューテーション
    │   ├── useAuth.ts            # スタッフ認証状態およびセッション管理
    │   ├── useDataLoading.ts     # データロードおよび自動更新の統括
    │   ├── useNativeSetup.ts     # Capacitor ネイティブ動作環境設定
    │   ├── useStaffData.ts       # 伝票・メニュー・店舗等のドメイン状態保持
    │   └── useStaffOperations.ts # 注文・伝票・会計・KDSの操作アクション
    ├── lib/            # API クライアントおよびユーティリティ
    │   ├── adminSelectors.ts # 管理画面データ抽出セレクター
    │   ├── adminUtils.ts     # マスタ管理ユーティリティ
    │   ├── appUtils.ts       # 時間判定・フォーマット・共通処理
    │   ├── firebase.ts       # Firebase Auth 接続クライアント
    │   ├── priceUtils.ts     # 税込/税抜・税率計算ロジック
    │   ├── staffReadApi.ts   # Workers / D1 バックエンド通信クライアント
    │   └── staffUtils.ts     # 伝票・KDSロジック補助関数
    ├── screens/        # 画面ビューコンポーネント
    │   ├── admin/            # マスタ管理・売上分析サブタブ群
    │   ├── staff/            # スタッフ画面サブビュー (Handy/Payment/DirectAction)
    │   ├── AdminScreen.tsx   # マスタメンテナンス・売上管理メイン画面
    │   ├── KdsScreen.tsx     # キッチンディスプレイシステム (KDS) 画面
    │   ├── LoginScreen.tsx   # スタッフログイン画面
    │   ├── SeatsScreen.tsx   # 座席情報・テーブル稼働画面
    │   ├── SetupScreen.tsx   # 端末設定画面 (Capacitorネイティブ設定)
    │   └── StaffScreen.tsx   # スタッフ伝票一覧・詳細画面
    ├── App.tsx         # ルーティング・状態結合メインコンポーネント
    ├── constants.ts   # ビュー定義およびセッションキー定数
    ├── main.tsx        # エントリポイント
    ├── styles.css      # 全体デザインシステム (CSS変数、100vhレイアウト)
    └── types.ts        # TypeScript 型定義
```

## 2. 主要モジュールの役割

### 2.1 `src/lib/`
- **`staffReadApi.ts`**: スタッフ・ハンディ端末・KDS・管理画面向けのバックエンド API 通信モジュール。Cloudflare Workers + D1 上のデータベースと同期します。
- **`firebase.ts`**: Firebase Authentication によるスタッフログインおよび認証トークン取得処理。
- **`priceUtils.ts`**: 店舗ごとの標準税率（10%）・軽減税率（8%）・税込/税抜表示切り替えに基づく金額計算モジュール。
- **`appUtils.ts`**: 時間帯チェック（メニュー提供時間外判定）や文字列整形、共通処理。

### 2.2 `src/screens/`
- **`StaffScreen.tsx` / `src/screens/staff/`**:
  - スタッフ向けメイン画面。稼働伝票一覧、伝票詳細、商品注文追加、明細数量変更・取消、会計（支払方法選択・テンキー入力・割勘・伝票加算）を制御します。
  - `StaffHandyView.tsx`: スマホ・ハンディ端末に最適化された直接注文入力モーダル。
  - `StaffPaymentView.tsx`: 会計・個別割勘・まとめ会計専用画面。
- **`KdsScreen.tsx`**: キッチンでの調理進捗管理画面（未調理 NEW → 調理中 COOKING → 提供済 SERVED）。
- **`SeatsScreen.tsx`**: 店舗のテーブル稼働・座席状況一覧画面。
- **`AdminScreen.tsx` / `src/screens/admin/`**: メニューブック、カテゴリ、サブカテゴリ、メニュー商品、トッピング、店舗・スタッフ、決済種別のマスタ管理および売上データ分析画面。
- **`SetupScreen.tsx`**: 端末識別名や Capacitor ネイティブプラグイン接続の設定画面。

### 2.3 `src/hooks/`
大規模なドメインロジックおよび状態管理を `App.tsx` から分離し、機能単位でカプセル化：
- **`useStaffData`**: リアルタイム伝票リスト、注文明細、テーブルマスタ、メニューブックマスタ等の保持。
- **`useStaffOperations`**: 伝票発行、注文送信、明細変更、会計データの保存、KDSステータス更新アクション。
- **`useAdminOperations` / `useAdminForm`**: 管理画面の個別マスタ編集フォーム状態と CRUD 通信。
- **`useAuth`**: ログイン状態、ユーザープロファイル、サインイン/サインアウト処理。
- **`useNativeSetup`**: モバイル端末（Capacitor）固有の設定・状態の読み書き。

### 2.4 `src/styles.css`
- **Layout Tokens**: `--v-header-h`, `--v-footer-h` などの CSS 変数を使用し、100vh 固定レイアウトの高さ計算を一元管理。
- **UI テーマ**: 店舗環境で視認性の高いダークモードテーマ、高コントラストのステータスバッジ、スピーディなタッチ操作に適した大きめのボタンコントロール。

## 3. モバイル・ネイティブ対応 (Capacitor)
- `@capacitor/core`, `@capacitor/cli` を標準統合。
- `capacitor.config.ts` にアプリ ID (`com.pachira.litehandy`) や Web ディレクトリ (`dist`) を定義。
- `npm run build` 後に `npx cap sync` を実行することで、`android/` および `ios/` プロジェクトへネイティブビルドを同期。

## 4. テスト (E2E Tests)
- **Playwright (`tests/`)**:
  - `single-order-smoke.spec.ts`, `quad-order-smoke.spec.ts` などの注文・会計スモークテスト。
  - `multi-context-foundation.spec.ts`: ハンディ端末からの注文入力、KDS での調理更新、スタッフ画面での会計処理の流れを自動検証。
