export declare function escapeHtml(text: string): string;
export declare function parseCsvLine(line: string): string[];
export declare function parseCsv(data: string): string[][];
export type Delimiter = "tsv" | "csv" | "spaces" | "markdown" | "auto";
export declare function detectDelimiter(data: string): "tsv" | "csv" | "spaces" | "markdown";
export declare function parseMarkdownTable(data: string): string[][];
export declare function parseSpaceSeparated(data: string): string[][];
export declare function toHtmlTable(data: string, hasHeader?: boolean, delimiter?: Delimiter): string;
export declare function tsvToHtmlTable(tsv: string, hasHeader?: boolean): string;
export declare function copyHtmlToClipboard(html: string, plainText: string): void;
//# sourceMappingURL=table-to-clipboard.d.ts.map