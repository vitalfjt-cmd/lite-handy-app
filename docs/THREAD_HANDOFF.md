# スレッド引き継ぎドキュメント (THREAD_HANDOFF)

## 2026-04-28 時点のステータス (v3 Native)

### 1. このスレッドで完了したこと
- **lite-app-v3 の作成**: `lite-app-v2` からコピーし、プロジェクト名を更新。
- **Native-app 化 (Capacitor 導入)**:
  - Capacitor (@capacitor/core, @capacitor/cli) をインストール・初期化。
  - Android および iOS プラットフォームを追加。
  - `package.json` にネイティブ同期用のスクリプト (`cap:sync`, `cap:open:*`) を追加。
- **ネイティブ向け UI 調整**:
  - `styles.css` に `env(safe-area-inset-*)` を追加し、ノッチやホームインジケーターに対応。
  - `user-select: none` やタップハイライトの無効化により、ネイティブアプリらしい挙動に調整。
- **ドキュメント整備**: `README_NATIVE.md` を作成し、ネイティブ開発フローを明文化。

### 2. 作成・更新した主要ファイル
- `capacitor.config.ts`: Capacitor 設定ファイル。
- `android/`, `ios/`: 各プラットフォームのネイティブプロジェクト。
- `package.json`: ネイティブ用スクリプトの追加。
- `src/styles.css`: セーフエリア対応とネイティブフィールの追加。
- `README_NATIVE.md`: ネイティブ開発用ガイド。

### 3. 現在の動作確認状況
- **ビルド**: `npx vite build` が正常に通り、`dist` が生成されることを確認。
- **ネイティブ同期**: `npx cap sync` により `dist` の内容が Android/iOS プロジェクトにコピーされることを確認。

### 4. 未解決・今後の課題
- **ネイティブプラグインの活用**: プリンター制御 (Bluetooth/USB) やスキャン機能のためのネイティブプラグイン導入の検討。
- **Android Studio での実機確認**: 実際のデバイスでのセーフエリアやパフォーマンスの検証。

### 5. 次回の最初の 1 手
- `npm run cap:open:android` を実行し、Android Studio でビルド・デバッグを開始する。
- プリンター連携が必要な場合、`capacitor-community` 等のプラグイン選定を行う。