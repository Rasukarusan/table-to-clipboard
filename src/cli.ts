#!/usr/bin/env node

import * as readline from "readline";
import { toHtmlTable, detectDelimiter, copyHtmlToClipboard, unescapeLiterals, Delimiter } from "./table-to-clipboard.js";

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

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: table-to-clipboard [options]

Convert text data (TSV, CSV, Markdown, space-separated) to clipboard format for spreadsheets.

Options:
  --csv        CSV format (overrides auto-detection)
  --tsv        TSV format (overrides auto-detection)
  --spaces     Space-separated format (overrides auto-detection)
  --markdown   Markdown table format (overrides auto-detection)
  --boxdraw    Box-drawing table format (overrides auto-detection)
  --no-header  Don't treat the first row as header
  --help, -h   Show this help message
  --version    Show version

Examples:
  pbpaste | table-to-clipboard
  cat data.csv | table-to-clipboard
  echo "A,B,C" | table-to-clipboard
`);
    process.exit(0);
  }

  if (args.includes("--version")) {
    const pkg = require("./package.json");
    console.log(pkg.version);
    process.exit(0);
  }

  const hasHeader = !args.includes("--no-header");

  let delimiter: Delimiter = "auto";
  if (args.includes("--csv")) delimiter = "csv";
  if (args.includes("--tsv")) delimiter = "tsv";
  if (args.includes("--spaces")) delimiter = "spaces";
  if (args.includes("--markdown") || args.includes("--md")) delimiter = "markdown";
  if (args.includes("--boxdraw")) delimiter = "boxdraw";

  const rawData = await readStdin();
  // \t, \n などのリテラル文字列を実際のエスケープシーケンスに変換
  const data = unescapeLiterals(rawData);

  if (!data.trim()) {
    console.error("No data provided");
    console.error("Usage: pbpaste | table-to-clipboard");
    console.error("Run 'table-to-clipboard --help' for more options");
    process.exit(1);
  }

  const detected = detectDelimiter(data);
  const actual = delimiter === "auto" ? detected : delimiter;
  console.error(`Format: ${actual.toUpperCase()} (${delimiter === "auto" ? "auto-detected" : "specified"})`);

  const html = toHtmlTable(data, hasHeader, delimiter);
  copyHtmlToClipboard(html, data);
  console.error("Copied to clipboard!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
