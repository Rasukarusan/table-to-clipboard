import { escapeHtml, tsvToHtmlTable } from "./tsv-to-richtext";

describe("escapeHtml", () => {
  it("特殊文字をエスケープする", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml("A & B")).toBe("A &amp; B");
    expect(escapeHtml('"test"')).toBe("&quot;test&quot;");
  });

  it("通常の文字列はそのまま返す", () => {
    expect(escapeHtml("hello")).toBe("hello");
    expect(escapeHtml("日本語")).toBe("日本語");
  });

  it("空文字列を処理できる", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("tsvToHtmlTable", () => {
  it("基本的なTSVをHTMLテーブルに変換する", () => {
    const tsv = "A\tB\tC\n1\t2\t3";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("ヘッダーなしオプションで全てtdになる", () => {
    const tsv = "A\tB\tC\n1\t2\t3";
    const result = tsvToHtmlTable(tsv, false);

    expect(result).toBe(
      "<table>" +
        "<tr><td>A</td><td>B</td><td>C</td></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("1行だけのTSVを処理できる", () => {
    const tsv = "A\tB\tC";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe("<table><tr><th>A</th><th>B</th><th>C</th></tr></table>");
  });

  it("日本語を正しく処理できる", () => {
    const tsv = "名前\t年齢\n田中\t30";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>名前</th><th>年齢</th></tr>" +
        "<tr><td>田中</td><td>30</td></tr>" +
        "</table>"
    );
  });

  it("特殊文字を含むセルをエスケープする", () => {
    const tsv = "<script>\t&test";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table><tr><th>&lt;script&gt;</th><th>&amp;test</th></tr></table>"
    );
  });

  it("空のセルを処理できる", () => {
    const tsv = "A\t\tC\n1\t\t3";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th></th><th>C</th></tr>" +
        "<tr><td>1</td><td></td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("前後の空白をtrimする", () => {
    const tsv = "\nA\tB\n1\t2\n";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th></tr>" +
        "<tr><td>1</td><td>2</td></tr>" +
        "</table>"
    );
  });

  it("複数行のデータを処理できる", () => {
    const tsv = "H1\tH2\nR1C1\tR1C2\nR2C1\tR2C2\nR3C1\tR3C2";
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>H1</th><th>H2</th></tr>" +
        "<tr><td>R1C1</td><td>R1C2</td></tr>" +
        "<tr><td>R2C1</td><td>R2C2</td></tr>" +
        "<tr><td>R3C1</td><td>R3C2</td></tr>" +
        "</table>"
    );
  });
});
