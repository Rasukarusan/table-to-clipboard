# text-to-table

テキストデータ（TSV, CSV, Markdown, スペース区切り）をスプレッドシートに貼り付け可能な形式に変換するCLIツール。

## インストール

```bash
pnpm install
```

## 使い方

```bash
# 標準入力からデータを読み込み、クリップボードにコピー
pbpaste | pnpm run start

# ファイルから読み込み
cat data.tsv | pnpm run start
```

変換後、Google スプレッドシートや Excel に直接貼り付けできます。

## 対応フォーマット

| フォーマット | 説明 | 自動検出 |
|------------|------|---------|
| TSV | タブ区切り | タブ文字があれば検出 |
| CSV | カンマ区切り | カンマがあれば検出 |
| Markdown | `\|A\|B\|` 形式 | `\|` で始まるか `\|...\|` を含む |
| スペース区切り | 2つ以上の連続スペース | 上記以外で連続スペースがあれば検出 |

### 自動検出の優先順位

1. Markdown テーブル
2. TSV（タブ）
3. CSV（カンマ）
4. スペース区切り

## オプション

```bash
# フォーマットを明示的に指定
pnpm run start -- --csv
pnpm run start -- --tsv
pnpm run start -- --spaces
pnpm run start -- --markdown

# 1行目をヘッダーとして扱わない
pnpm run start -- --no-header
```

## 使用例

### TSV

```bash
echo -e "名前\t年齢\t職業\n田中\t30\tエンジニア" | pnpm run start
```

### CSV

```bash
echo "名前,年齢,職業
田中,30,エンジニア" | pnpm run start
```

### Markdown テーブル

```bash
echo '|名前|年齢|職業|
|---|---|---|
|田中|30|エンジニア|' | pnpm run start
```

### スペース区切り（ターミナル出力のコピー用）

```bash
echo "名前    年齢    職業
田中    30      エンジニア" | pnpm run start
```

### セル内改行を含む CSV

```bash
echo 'Name,Comment
"田中","これは
複数行の
コメントです"' | pnpm run start
```

## テスト

```bash
pnpm test
```

## 動作環境

- macOS（`pbcopy`, `textutil` を使用）
- Node.js
