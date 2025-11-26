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

export type Delimiter = "tsv" | "csv" | "auto";

export function detectDelimiter(data: string): "tsv" | "csv" {
  const firstLine = data.split("\n")[0];

  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  // タブがあればTSV、なければCSV
  if (tabCount > 0) {
    return "tsv";
  }
  if (commaCount > 0) {
    return "csv";
  }

  // どちらもなければTSVとして扱う
  return "tsv";
}

export function toHtmlTable(
  data: string,
  hasHeader: boolean = true,
  delimiter: Delimiter = "auto"
): string {
  const actualDelimiter = delimiter === "auto" ? detectDelimiter(data) : delimiter;

  const rows: string[][] =
    actualDelimiter === "csv"
      ? parseCsv(data.trim())
      : data.trim().split("\n").map((line) => line.split("\t"));

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

export function copyHtmlToClipboard(html: string): void {
  const tempHtml = path.join(os.tmpdir(), "clipboard-temp.html");
  const tempRtf = path.join(os.tmpdir(), "clipboard-temp.rtf");

  // 完全なHTML文書として保存
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  fs.writeFileSync(tempHtml, fullHtml);

  try {
    // HTMLをRTFに変換
    execSync(`textutil -convert rtf -output "${tempRtf}" "${tempHtml}"`);

    // RTFをクリップボードにコピー
    const rtfContent = fs.readFileSync(tempRtf, "utf-8");
    const script = `set the clipboard to {«class RTF »:«data RTF ${Buffer.from(rtfContent).toString("hex")}»}`;
    execSync(`osascript -e '${script}'`);
  } catch (error) {
    console.error("クリップボードへのコピーに失敗しました:", error);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
    if (fs.existsSync(tempRtf)) fs.unlinkSync(tempRtf);
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

  // 標準入力からデータを読み取り
  const data = await readStdin();

  if (!data.trim()) {
    console.error("データが入力されていません");
    console.error("使用方法: pbpaste | pnpm run start [オプション]");
    console.error("オプション:");
    console.error("  --csv        CSV形式として処理（自動判定を上書き）");
    console.error("  --tsv        TSV形式として処理（自動判定を上書き）");
    console.error("  --no-header  1行目をヘッダーとして扱わない");
    process.exit(1);
  }

  const detected = detectDelimiter(data);
  const actual = delimiter === "auto" ? detected : delimiter;
  console.error(`形式: ${actual.toUpperCase()}（${delimiter === "auto" ? "自動検出" : "指定"}）`);

  const html = toHtmlTable(data, hasHeader, delimiter);
  copyHtmlToClipboard(html);
}

// CLIとして実行された場合のみmainを実行
if (require.main === module) {
  main().catch(console.error);
}
