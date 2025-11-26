import { escapeHtml, tsvToHtmlTable, toHtmlTable, parseCsvLine, parseCsv, detectDelimiter } from "./tsv-to-richtext";

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

describe("parseCsvLine", () => {
  it("基本的なCSV行をパースする", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("ダブルクォートで囲まれたフィールドを処理する", () => {
    expect(parseCsvLine('"hello","world"')).toEqual(["hello", "world"]);
  });

  it("カンマを含むフィールドを処理する", () => {
    expect(parseCsvLine('"a,b",c')).toEqual(["a,b", "c"]);
  });

  it("エスケープされたダブルクォートを処理する", () => {
    expect(parseCsvLine('"say ""hello""",test')).toEqual(['say "hello"', "test"]);
  });

  it("空のフィールドを処理する", () => {
    expect(parseCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("日本語を処理する", () => {
    expect(parseCsvLine("名前,年齢,職業")).toEqual(["名前", "年齢", "職業"]);
  });
});

describe("toHtmlTable with CSV", () => {
  it("基本的なCSVをHTMLテーブルに変換する", () => {
    const csv = "A,B,C\n1,2,3";
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("カンマを含むセルを正しく処理する", () => {
    const csv = 'Name,Address\n"Tanaka, Taro","Tokyo, Japan"';
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>Name</th><th>Address</th></tr>" +
        "<tr><td>Tanaka, Taro</td><td>Tokyo, Japan</td></tr>" +
        "</table>"
    );
  });

  it("空のセルを処理できる", () => {
    const csv = "A,,C\n1,,3";
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th></th><th>C</th></tr>" +
        "<tr><td>1</td><td></td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("セル内の改行を処理できる", () => {
    const csv = 'Name,Comment\n"田中","これは\n複数行の\nコメントです"';
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>Name</th><th>Comment</th></tr>" +
        "<tr><td>田中</td><td>これは<br>複数行の<br>コメントです</td></tr>" +
        "</table>"
    );
  });
});

describe("parseCsv", () => {
  it("セル内改行を含むCSVをパースする", () => {
    const csv = 'A,B\n"line1\nline2",C';
    const result = parseCsv(csv);

    expect(result).toEqual([
      ["A", "B"],
      ["line1\nline2", "C"],
    ]);
  });

  it("複数の複数行セルを処理する", () => {
    const csv = '"a\nb","c\nd"';
    const result = parseCsv(csv);

    expect(result).toEqual([["a\nb", "c\nd"]]);
  });
});

describe("detectDelimiter", () => {
  it("タブがあればTSVと判定する", () => {
    expect(detectDelimiter("A\tB\tC\n1\t2\t3")).toBe("tsv");
  });

  it("カンマがあればCSVと判定する", () => {
    expect(detectDelimiter("A,B,C\n1,2,3")).toBe("csv");
  });

  it("タブとカンマ両方あればTSV優先", () => {
    expect(detectDelimiter("A,B\tC\n1,2\t3")).toBe("tsv");
  });

  it("どちらもなければTSV", () => {
    expect(detectDelimiter("ABC")).toBe("tsv");
  });
});

describe("toHtmlTable with auto detection", () => {
  it("TSVを自動検出する", () => {
    const tsv = "A\tB\n1\t2";
    const result = toHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th></tr>" +
        "<tr><td>1</td><td>2</td></tr>" +
        "</table>"
    );
  });

  it("CSVを自動検出する", () => {
    const csv = "A,B\n1,2";
    const result = toHtmlTable(csv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th></tr>" +
        "<tr><td>1</td><td>2</td></tr>" +
        "</table>"
    );
  });
});
