import {execSync} from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tsvToHtmlTable(tsv: string, hasHeader: boolean = true): string {
  const lines = tsv.trim().split("\n");
  let html = "<table>";

  lines.forEach((line, index) => {
    const cells = line.split("\t");
    const isHeader = hasHeader && index === 0;
    const tag = isHeader ? "th" : "td";

    html += "<tr>";
    cells.forEach((cell) => {
      html += `<${tag}>${escapeHtml(cell)}</${tag}>`;
    });
    html += "</tr>";
  });

  html += "</table>";
  return html;
}

function copyHtmlToClipboard(html: string): void {
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

  // 標準入力からTSVを読み取り
  const tsv = await readStdin();

  if (!tsv.trim()) {
    console.error("TSVデータが入力されていません");
    console.error("使用方法: pbpaste | npx ts-node tsv-to-richtext.ts");
    console.error("オプション: --no-header (1行目をヘッダーとして扱わない)");
    process.exit(1);
  }

  const html = tsvToHtmlTable(tsv, hasHeader);
  copyHtmlToClipboard(html);
}

main().catch(console.error);
