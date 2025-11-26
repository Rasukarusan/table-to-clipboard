import { execSync } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function unescapeLiterals(text: string): string {
  return text
    .replace(/\\t/g, "\t")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");
}

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  cells.push(current);
  return cells;
}

export function parseCsv(data: string): string[][] {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const nextChar = data[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        if (char === "\r") i++;
      } else {
        currentCell += char;
      }
    }
  }

  // 最後のセルと行を追加
  currentRow.push(currentCell);
  if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

export type Delimiter = "tsv" | "csv" | "spaces" | "markdown" | "auto";

export function detectDelimiter(data: string): "tsv" | "csv" | "spaces" | "markdown" {
  const firstLine = data.split("\n")[0];

  // markdownテーブルの判定（|で始まるか、|を含む行）
  const trimmedFirst = firstLine.trim();
  if (trimmedFirst.startsWith("|") || /\|.*\|/.test(trimmedFirst)) {
    return "markdown";
  }

  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const multiSpaceCount = (firstLine.match(/  +/g) || []).length; // 2つ以上の連続スペース

  // タブがあればTSV
  if (tabCount > 0) {
    return "tsv";
  }
  // カンマがあればCSV
  if (commaCount > 0) {
    return "csv";
  }
  // 2つ以上の連続スペースがあればspaces
  if (multiSpaceCount > 0) {
    return "spaces";
  }

  // どちらもなければTSVとして扱う
  return "tsv";
}

export function parseMarkdownTable(data: string): string[][] {
  const lines = data.trim().split("\n");
  const rows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 区切り行（|---|---|）をスキップ
    if (/^\|?[\s\-:|]+\|?$/.test(trimmed)) {
      continue;
    }

    // |で分割し、前後の空要素を除去
    const cells = trimmed
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, index, arr) => {
        // 最初と最後の空要素を除去（|で始まり|で終わる場合）
        if (index === 0 && arr[0] === "") return false;
        if (index === arr.length - 1 && arr[arr.length - 1] === "") return false;
        return true;
      });

    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
}

export function parseSpaceSeparated(data: string): string[][] {
  return data.trim().split("\n").map((line) => {
    // 2つ以上の連続スペースで分割し、各セルをtrim
    return line.split(/  +/).map((cell) => cell.trim());
  });
}

export function toHtmlTable(
  data: string,
  hasHeader: boolean = true,
  delimiter: Delimiter = "auto"
): string {
  const actualDelimiter = delimiter === "auto" ? detectDelimiter(data) : delimiter;

  let rows: string[][];
  switch (actualDelimiter) {
    case "csv":
      rows = parseCsv(data.trim());
      break;
    case "spaces":
      rows = parseSpaceSeparated(data);
      break;
    case "markdown":
      rows = parseMarkdownTable(data);
      break;
    default:
      rows = data.trim().split("\n").map((line) => line.split("\t"));
  }

  let html = "<table>";

  rows.forEach((cells, index) => {
    const isHeader = hasHeader && index === 0;
    const tag = isHeader ? "th" : "td";

    html += "<tr>";
    cells.forEach((cell) => {
      // セル内改行を<br>に変換
      const escaped = escapeHtml(cell).replace(/\n/g, "<br>");
      html += `<${tag}>${escaped}</${tag}>`;
    });
    html += "</tr>";
  });

  html += "</table>";
  return html;
}

// 後方互換性のため
export function tsvToHtmlTable(tsv: string, hasHeader: boolean = true): string {
  return toHtmlTable(tsv, hasHeader, "tsv");
}

export function copyHtmlToClipboard(html: string, plainText: string): void {
  const tempHtml = path.join(os.tmpdir(), "clipboard-temp.html");
  const tempRtf = path.join(os.tmpdir(), "clipboard-temp.rtf");
  const tempText = path.join(os.tmpdir(), "clipboard-temp.txt");
  const tempSwift = path.join(os.tmpdir(), "clipboard-temp.swift");

  // 完全なHTML文書として保存
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  fs.writeFileSync(tempHtml, fullHtml);
  fs.writeFileSync(tempText, plainText);

  try {
    // HTMLをRTFに変換
    execSync(`textutil -convert rtf -output "${tempRtf}" "${tempHtml}"`);

    // Swiftスクリプトで複数形式をクリップボードにコピー
    // AppleScriptだとHex文字列が長すぎるとエラーになるため、Swiftを使用
    const swiftCode = `
import Cocoa

let rtfPath = "${tempRtf}"
let textPath = "${tempText}"

guard let rtfData = FileManager.default.contents(atPath: rtfPath),
      let textData = FileManager.default.contents(atPath: textPath) else {
    exit(1)
}

let pasteboard = NSPasteboard.general
pasteboard.clearContents()
pasteboard.setData(rtfData, forType: .rtf)
pasteboard.setData(textData, forType: .string)
`;
    fs.writeFileSync(tempSwift, swiftCode);
    execSync(`swift "${tempSwift}"`);
  } catch (error) {
    console.error("クリップボードへのコピーに失敗しました:", error);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
    if (fs.existsSync(tempRtf)) fs.unlinkSync(tempRtf);
    if (fs.existsSync(tempText)) fs.unlinkSync(tempText);
    if (fs.existsSync(tempSwift)) fs.unlinkSync(tempSwift);
  }
}

async function readStdin(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const lines: string[] = [];

  for await (const line of rl) {
    lines.push(line);
  }

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const hasHeader = !args.includes("--no-header");

  // 明示的に指定された場合のみ使用、なければauto
  let delimiter: Delimiter = "auto";
  if (args.includes("--csv")) delimiter = "csv";
  if (args.includes("--tsv")) delimiter = "tsv";
  if (args.includes("--spaces")) delimiter = "spaces";
  if (args.includes("--markdown") || args.includes("--md")) delimiter = "markdown";

  // 標準入力からデータを読み取り
  const rawData = await readStdin();
  // \t, \n などのリテラル文字列を実際のエスケープシーケンスに変換
  const data = unescapeLiterals(rawData);

  if (!data.trim()) {
    console.error("データが入力されていません");
    console.error("使用方法: pbpaste | pnpm run start [オプション]");
    console.error("オプション:");
    console.error("  --csv        CSV形式として処理（自動判定を上書き）");
    console.error("  --tsv        TSV形式として処理（自動判定を上書き）");
    console.error("  --spaces     スペース区切り形式として処理（自動判定を上書き）");
    console.error("  --markdown   Markdownテーブル形式として処理（自動判定を上書き）");
    console.error("  --no-header  1行目をヘッダーとして扱わない");
    process.exit(1);
  }

  const detected = detectDelimiter(data);
  const actual = delimiter === "auto" ? detected : delimiter;
  console.error(`形式: ${actual.toUpperCase()}（${delimiter === "auto" ? "自動検出" : "指定"}）`);

  const html = toHtmlTable(data, hasHeader, delimiter);
  copyHtmlToClipboard(html, data);
}

// CLIとして実行された場合のみmainを実行
if (require.main === module) {
  main().catch(console.error);
}
