#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const table_to_clipboard_js_1 = require("./table-to-clipboard.js");
async function readStdin() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    const lines = [];
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
    let delimiter = "auto";
    if (args.includes("--csv"))
        delimiter = "csv";
    if (args.includes("--tsv"))
        delimiter = "tsv";
    if (args.includes("--spaces"))
        delimiter = "spaces";
    if (args.includes("--markdown") || args.includes("--md"))
        delimiter = "markdown";
    const rawData = await readStdin();
    // \t, \n などのリテラル文字列を実際のエスケープシーケンスに変換
    const data = (0, table_to_clipboard_js_1.unescapeLiterals)(rawData);
    if (!data.trim()) {
        console.error("No data provided");
        console.error("Usage: pbpaste | table-to-clipboard");
        console.error("Run 'table-to-clipboard --help' for more options");
        process.exit(1);
    }
    const detected = (0, table_to_clipboard_js_1.detectDelimiter)(data);
    const actual = delimiter === "auto" ? detected : delimiter;
    console.error(`Format: ${actual.toUpperCase()} (${delimiter === "auto" ? "auto-detected" : "specified"})`);
    const html = (0, table_to_clipboard_js_1.toHtmlTable)(data, hasHeader, delimiter);
    (0, table_to_clipboard_js_1.copyHtmlToClipboard)(html, data);
    console.error("Copied to clipboard!");
}
main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map