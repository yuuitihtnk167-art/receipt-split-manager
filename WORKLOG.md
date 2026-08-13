# WORKLOG

## 1. アプリ名

- アプリ名: Receipt Split Manager
- パッケージ名: receipt-split-manager

## 2. GitHubリポジトリURL

https://github.com/yuuitihtnk167-art/receipt-split-manager

## 3. ローカル作業フォルダ

```text
C:\GitHub\money\receipt-split-manager
```

ローカルフォルダ名も `receipt-split-manager` に統一しています。

## 4. 現在実装済みの機能

- Vite + React + TypeScript のWebアプリ構成
- GitHub Pages / PWA用設定
  - 公開パス: `/receipt-split-manager/`
  - 公開URL: `https://yuuitihtnk167-art.github.io/receipt-split-manager/`
- localStorageによるローカル保存
- 分割入力専用の商品登録
  - カテゴリ
  - 日付
  - 内容
  - 支出元
  - メモ
  - 金額（税込）
  - 分割月数
  - 開始月
- マネーフォワード風カテゴリ
  - 大分類と小分類の2段階選択
  - 大分類は初期一覧を固定
  - 小分類の追加、名前変更、削除
- 分割予定の自動作成
  - 端数は最終月で調整
- 今月の入力予定表示
- 月別予定一覧
- 入力済み / 未入力の切り替え
- 登録済み商品一覧
- 商品編集
  - 分割予定を再計算
  - 同じ対象月の入力済み状態は保持
- 商品削除
  - 商品に紐づく分割設定と分割予定も削除
- JSONバックアップ / 復元
  - 商品データ
  - 分割設定
  - 分割予定
  - カテゴリ設定
- CSVエクスポート
  - 商品一覧CSV
  - 分割予定CSV
  - UTF-8 BOM付き

## 5. 直近のコミット履歴

```text
5dd6ee9 Add product edit functionality
ec52443 Simplify app to split entry manager
55b3ffc Revert OCR preprocessing experiment
```

## 6. 現在未実装の機能

- 高額品の分割入力おすすめ機能
- 今月の未入力予定をさらに目立たせる表示
- 家計簿アプリ向け専用エクスポート
- 月額家電簿との連携
- IndexedDBへの移行
- クラウド同期
- ログイン / 複数端末同期

## 7. 次にやる予定の作業

- 高額品の分割入力おすすめ機能
  - 初期閾値は10,000円を想定
  - 商品入力時に「分割入力をおすすめします」と表示
  - 自動変更はせず、ユーザーが判断できる形にする
- 今月の入力予定画面の強化
  - 未入力件数を目立たせる
  - 未入力合計額を大きく表示する
  - 月が変わったときに今月分を確認しやすくする

## 8. 開発時の起動方法

```bash
npm install
npm run dev
```

通常は以下で表示します。

```text
http://localhost:5173/receipt-split-manager/
```

スマホ実機で確認する場合は、同じWi-Fi内のPCで以下を実行します。

```bash
npm run dev -- --host 0.0.0.0
```

スマホから以下の形式でアクセスします。

```text
http://PCのIPアドレス:5173/receipt-split-manager/
```

## 9. ビルド確認方法

```bash
npm run build
```

ビルド成功時は `dist/` に成果物が出力されます。

## 10. 注意点

- データ保存はlocalStorageです。
- 既存データ互換のため、localStorageキー `receipt-split-manager:v1` は変更しません。
- PWA manifestの`id`は追加していません。旧URLでインストール済みの場合は、新URLで再インストールが必要になる可能性があります。
- ブラウザ変更、端末変更、キャッシュ削除、サイトデータ削除でデータが消える可能性があります。
- 重要なデータはデータ管理タブからJSONバックアップしてください。
- 実支出と配分入力は別データとして扱います。
- 分割入力の端数は最終月で調整します。
- 新規保存と編集保存では商品を常に分割入力として保存します。
- 旧データに通常入力の商品が残っていても削除せず、商品一覧に表示します。
- 旧通常入力の商品を編集保存すると、分割設定と分割予定が作成されます。
- 旧データに分類文字列だけがある場合は表示用に残し、編集時は未分類扱いにします。
- 旧JSONにカテゴリ設定がない場合は初期カテゴリを使います。
- `origin`は `https://github.com/yuuitihtnk167-art/receipt-split-manager.git` に設定済みです。
