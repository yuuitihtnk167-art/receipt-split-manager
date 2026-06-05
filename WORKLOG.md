# WORKLOG

## 1. アプリ名

receipt-split-manager

## 2. GitHubリポジトリURL

https://github.com/yuuitihtnk167-art/receipt-split-manager

## 3. ローカル作業フォルダ

```text
C:\GitHub\money\receipt-split-manager
```

## 4. 現在実装済みの機能

- Vite + React + TypeScript のWebアプリ構成
- localStorageによるローカル保存
- 商品入力
  - 購入日
  - 店舗名
  - レシート上の商品名
  - 正式商品名
  - 金額（税込）
  - 分類
  - 通常入力 / 分割入力
- 分割入力
  - 分割月数
  - 開始月
  - 月額入力額の自動計算
  - 端数は最終月で調整
  - メモ
- 今月の入力予定表示
- 月別予定一覧
- 入力済み / 未入力の切り替え
- 登録済み商品一覧
- 商品削除
  - 商品に紐づく分割設定・分割予定も削除
- 学習辞書
  - 候補表示
  - 削除
- JSONバックアップ / 復元
- CSVエクスポート
  - 商品一覧CSV
  - 分割予定CSV
  - UTF-8 BOM付き
- レシート読取タブの土台
  - カメラ撮影
  - 画像ファイル選択
  - 複数画像選択
  - ブラウザ内OCRによるテキスト読み取り
  - OCR結果テキストの貼り付け・手修正
  - 1行ごとの商品候補化
  - 正式商品名・金額・分類の編集
  - 通常入力登録
  - 分割入力登録
  - 学習辞書による正式商品名・分類の自動補完

## 5. 直近のコミット履歴

```text
2371ace Add split registration from receipt reader
4767264 Add learning dictionary autofill for receipt reader
929c725 Fix receipt reader item registration
a7a5b02 Add receipt reader draft input tab
5b1f071 Add CSV export for products and split schedules
1280885 Stabilize JSON backup export download
fefaaff Add JSON backup and restore feature
249d217 Add delete actions for products and learning dictionary
9818f8c Initial receipt split manager implementation
6d7805d Initial commit
```

## 6. 現在未実装の機能

- 長いレシートの複数画像結合
- 電子レシート取り込み
- 家計簿アプリ向け専用エクスポート
- 高額品の自動判定
- 高額品の分割入力おすすめ機能
- 月額家電簿との連携
- IndexedDBへの移行
- クラウド同期
- ログイン / 複数端末同期
- GitHub Pages対応

## 7. 次にやる予定の作業

- 高額品の分割入力おすすめ機能
  - 商品入力またはレシート読取時に、一定金額以上の商品を検出する
  - 「分割入力にしますか？」のような提案を表示する
  - 金額や分類に応じた分割月数の初期値を検討する
  - 既存の通常入力・分割入力フローを壊さず、提案は任意で選べる形にする

## 8. 開発時の起動方法

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで表示します。

```text
http://localhost:5173/
```

環境によってはViteが別ポートを使う場合があります。現在の作業中は `http://[::1]:5174/` で表示されることがありました。

### スマホ実機でのOCR確認手順

PCとスマホを同じWi-Fiに接続します。

```bash
npm run dev -- --host 0.0.0.0
```

PCのローカルIPアドレスを確認し、スマホのブラウザで以下の形式で開きます。

```text
http://PCのIPアドレス:5173/
```

確認項目:

1. 「レシート読取」タブを開く
2. 「カメラで撮影」でスマホ標準カメラが起動するか確認する
3. 「画像を選択」で保存済み画像を1枚選択できるか確認する
4. 「複数画像を選択」で複数画像を選択できるか確認する
5. OCR結果が「OCR結果の貼り付け・修正」欄へ入るか確認する
6. OCR結果を必要に応じて手修正できるか確認する
7. 「1行ごとに分解」で商品候補化できるか確認する

注意:

- カメラ利用はブラウザ権限、端末、ブラウザ仕様、`HTTPS` / `localhost` 条件に依存します。
- スマホからPCのIPアドレスでアクセスする場合、ブラウザによってはカメラ起動やOCR関連の動作に制限が出ることがあります。
- 長いレシートの画像合成、重複行削除、重なり判定は未実装です。

## 9. ビルド確認方法

```bash
npm run build
```

ビルド成功時は `dist/` に成果物が出力されます。

## 10. 注意点

- データ保存はlocalStorageです。
- ブラウザ変更、端末変更、キャッシュ削除、サイトデータ削除でデータが消える可能性があります。
- 重要なデータはデータ管理タブからJSONバックアップしてください。
- 実支出と配分入力は別データとして扱っています。
- 分割入力の端数は最終月で調整します。
- 長いレシートの画像結合はまだ実装していません。
- OCRはブラウザ内で動作しますが、実機ではブラウザ権限やネットワーク条件の影響を受ける場合があります。
- Codex in-app browserではダウンロードや一部入力自動操作に制約があり、通常ブラウザと挙動確認範囲が異なる場合があります。
- Windows環境ではGit操作時に `safe.directory` 指定が必要になることがあります。
- push先は `origin/main` です。
