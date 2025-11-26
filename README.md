# table-to-clipboard

テキストデータ（TSV, CSV, Markdown, スペース区切り）をスプレッドシートに貼り付け可能な形式に変換するCLIツール。

## インストール

```bash
npm install -g @rasukarusan/table-to-clipboard
```

## 使い方

```bash
# 標準入力からデータを読み込み、クリップボードにコピー
pbpaste | table-to-clipboard

# ファイルから読み込み
cat data.csv | table-to-clipboard
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
table-to-clipboard --csv
table-to-clipboard --tsv
table-to-clipboard --spaces
table-to-clipboard --markdown

# 1行目をヘッダーとして扱わない
table-to-clipboard --no-header

# ヘルプ
table-to-clipboard --help
```

## 使用例

### TSV

```bash
echo -e "名前\t年齢\t職業\n田中\t30\tエンジニア" | table-to-clipboard
```

### CSV

```bash
echo "名前,年齢,職業
田中,30,エンジニア" | table-to-clipboard
```

### Markdown テーブル

```bash
echo '|名前|年齢|職業|
|---|---|---|
|田中|30|エンジニア|' | table-to-clipboard
```

### スペース区切り（ターミナル出力のコピー用）

```bash
echo "名前    年齢    職業
田中    30      エンジニア" | table-to-clipboard
```

### セル内改行を含む CSV

```bash
echo 'Name,Comment
"田中","これは
複数行の
コメントです"' | table-to-clipboard
```

## 開発

```bash
# 依存のインストール
pnpm install

# 開発（TypeScript直接実行）
echo "A,B,C" | pnpm run dev

# ビルド
pnpm run build

# ビルド済みCLIの動作確認
echo "A,B,C" | pnpm run start

# テスト
pnpm test
```

## 動作環境

- macOS（`pbcopy`, `textutil` を使用）
- Node.js >= 16
