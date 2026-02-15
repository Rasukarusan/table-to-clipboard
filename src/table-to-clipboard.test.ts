import * as fs from "fs";
import * as path from "path";
import { escapeHtml, tsvToHtmlTable, toHtmlTable, parseCsvLine, parseCsv, detectDelimiter, parseSpaceSeparated, parseMarkdownTable, parseBoxDrawTable, unescapeLiterals } from "./table-to-clipboard";

// テストデータを読み込むヘルパー関数
const loadTestData = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, "testdata", filename), "utf-8");
};

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

describe("unescapeLiterals", () => {
  it("\\tを実際のタブに変換する", () => {
    expect(unescapeLiterals("A\\tB\\tC")).toBe("A\tB\tC");
  });

  it("\\nを実際の改行に変換する", () => {
    expect(unescapeLiterals("A\\nB")).toBe("A\nB");
  });

  it("\\t と \\n の組み合わせを変換する", () => {
    expect(unescapeLiterals("名前\\t年齢\\n田中\\t30")).toBe("名前\t年齢\n田中\t30");
  });

  it("エスケープシーケンスがなければそのまま返す", () => {
    expect(unescapeLiterals("hello")).toBe("hello");
  });
});

describe("tsvToHtmlTable", () => {
  it("基本的なTSVをHTMLテーブルに変換する", () => {
    const tsv = loadTestData("basic.tsv");
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("ヘッダーなしオプションで全てtdになる", () => {
    const tsv = loadTestData("basic.tsv");
    const result = tsvToHtmlTable(tsv, false);

    expect(result).toBe(
      "<table>" +
        "<tr><td>A</td><td>B</td><td>C</td></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("1行だけのTSVを処理できる", () => {
    const tsv = loadTestData("single-row.tsv");
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe("<table><tr><th>A</th><th>B</th><th>C</th></tr></table>");
  });

  it("日本語を正しく処理できる", () => {
    const tsv = loadTestData("japanese.tsv");
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>名前</th><th>年齢</th></tr>" +
        "<tr><td>田中</td><td>30</td></tr>" +
        "</table>"
    );
  });

  it("特殊文字を含むセルをエスケープする", () => {
    const tsv = loadTestData("special-chars.tsv");
    const result = tsvToHtmlTable(tsv);

    expect(result).toBe(
      "<table><tr><th>&lt;script&gt;</th><th>&amp;test</th></tr></table>"
    );
  });

  it("空のセルを処理できる", () => {
    const tsv = loadTestData("empty-cells.tsv");
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
    const tsv = loadTestData("multirow.tsv");
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
    const csv = loadTestData("basic.csv");
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("カンマを含むセルを正しく処理する", () => {
    const csv = loadTestData("with-comma.csv");
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>Name</th><th>Address</th></tr>" +
        "<tr><td>Tanaka, Taro</td><td>Tokyo, Japan</td></tr>" +
        "</table>"
    );
  });

  it("空のセルを処理できる", () => {
    const csv = loadTestData("empty-cells.csv");
    const result = toHtmlTable(csv, true, "csv");

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th></th><th>C</th></tr>" +
        "<tr><td>1</td><td></td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("セル内の改行を処理できる", () => {
    const csv = loadTestData("multiline.csv");
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
    const csv = loadTestData("cell-newline.csv");
    const result = parseCsv(csv);

    expect(result).toEqual([
      ["A", "B"],
      ["line1\nline2", "C"],
    ]);
  });

  it("複数の複数行セルを処理する", () => {
    const csv = loadTestData("multi-multiline.csv");
    const result = parseCsv(csv);

    expect(result).toEqual([["a\nb", "c\nd"]]);
  });
});

describe("detectDelimiter", () => {
  it("タブがあればTSVと判定する", () => {
    const tsv = loadTestData("basic.tsv");
    expect(detectDelimiter(tsv)).toBe("tsv");
  });

  it("カンマがあればCSVと判定する", () => {
    const csv = loadTestData("basic.csv");
    expect(detectDelimiter(csv)).toBe("csv");
  });

  it("タブとカンマ両方あればTSV優先", () => {
    expect(detectDelimiter("A,B\tC\n1,2\t3")).toBe("tsv");
  });

  it("2つ以上の連続スペースがあればspacesと判定する", () => {
    const spaces = loadTestData("space-separated.txt");
    expect(detectDelimiter(spaces)).toBe("spaces");
  });

  it("markdownテーブルを判定する", () => {
    const md = loadTestData("basic.md");
    expect(detectDelimiter(md)).toBe("markdown");
    expect(detectDelimiter("| A | B | C |")).toBe("markdown");
  });

  it("どちらもなければTSV", () => {
    expect(detectDelimiter("ABC")).toBe("tsv");
  });
});

describe("parseMarkdownTable", () => {
  it("基本的なmarkdownテーブルをパースする", () => {
    const md = loadTestData("basic.md");
    const result = parseMarkdownTable(md);

    expect(result).toEqual([
      ["A", "B", "C"],
      ["1", "2", "3"],
    ]);
  });

  it("スペースを含むmarkdownテーブルをパースする", () => {
    const md = loadTestData("with-spaces.md");
    const result = parseMarkdownTable(md);

    expect(result).toEqual([
      ["品名", "金額"],
      ["カフェ", "560"],
    ]);
  });

  it("空セルを含むmarkdownテーブルをパースする", () => {
    const md = loadTestData("empty-cells.md");
    const result = parseMarkdownTable(md);

    expect(result).toEqual([
      ["品名", "勘定科目", "空白", "取引先"],
      ["カフェ", "雑費", "", "コメダ珈琲店"],
    ]);
  });

  it("インデントされたmarkdownテーブルをパースする", () => {
    const md = loadTestData("indented.md");
    const result = parseMarkdownTable(md);

    expect(result).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });
});

describe("toHtmlTable with markdown", () => {
  it("markdownテーブルを自動検出してHTMLテーブルに変換する", () => {
    const md = loadTestData("japanese.md");
    const result = toHtmlTable(md);

    expect(result).toBe(
      "<table>" +
        "<tr><th>名前</th><th>年齢</th></tr>" +
        "<tr><td>田中</td><td>30</td></tr>" +
        "</table>"
    );
  });
});

describe("parseSpaceSeparated", () => {
  it("連続スペースで区切る", () => {
    const data = loadTestData("space-separated.txt");
    const result = parseSpaceSeparated(data);

    expect(result).toEqual([
      ["名前", "年齢", "職業"],
      ["田中", "30", "エンジニア"],
    ]);
  });

  it("スペース数が異なっても正しく分割する", () => {
    const data = loadTestData("space-varying.txt");
    const result = parseSpaceSeparated(data);

    expect(result).toEqual([
      ["A", "B", "C"],
      ["1", "2", "3"],
    ]);
  });

  it("単一スペースはセル内に残る", () => {
    const data = loadTestData("space-single.txt");
    const result = parseSpaceSeparated(data);

    expect(result).toEqual([["Hello World", "Test"]]);
  });
});

describe("toHtmlTable with spaces", () => {
  it("スペース区切りを自動検出してHTMLテーブルに変換する", () => {
    const data = loadTestData("space-separated.txt");
    const result = toHtmlTable(data);

    expect(result).toBe(
      "<table>" +
        "<tr><th>名前</th><th>年齢</th><th>職業</th></tr>" +
        "<tr><td>田中</td><td>30</td><td>エンジニア</td></tr>" +
        "</table>"
    );
  });
});

describe("toHtmlTable with auto detection", () => {
  it("TSVを自動検出する", () => {
    const tsv = loadTestData("basic.tsv");
    const result = toHtmlTable(tsv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });

  it("CSVを自動検出する", () => {
    const csv = loadTestData("basic.csv");
    const result = toHtmlTable(csv);

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });
});

describe("detectDelimiter with boxdraw", () => {
  it("罫線テーブルをboxdrawと判定する", () => {
    const data = loadTestData("boxdraw-basic.txt");
    expect(detectDelimiter(data)).toBe("boxdraw");
  });

  it("日本語を含む罫線テーブルをboxdrawと判定する", () => {
    const data = loadTestData("boxdraw-japanese.txt");
    expect(detectDelimiter(data)).toBe("boxdraw");
  });
});

describe("parseBoxDrawTable", () => {
  it("基本的な罫線テーブルをパースする", () => {
    const data = loadTestData("boxdraw-basic.txt");
    const result = parseBoxDrawTable(data);

    expect(result).toEqual([
      ["A", "B", "C"],
      ["1", "2", "3"],
    ]);
  });

  it("日本語を含む罫線テーブルをパースする", () => {
    const data = loadTestData("boxdraw-japanese.txt");
    const result = parseBoxDrawTable(data);

    expect(result).toEqual([
      ["品名", "勘定科目", "空白"],
      ["ChatGPT Plus", "通信費", ""],
    ]);
  });
});

describe("toHtmlTable with boxdraw", () => {
  it("罫線テーブルを自動検出してHTMLテーブルに変換する", () => {
    const data = loadTestData("boxdraw-japanese.txt");
    const result = toHtmlTable(data);

    expect(result).toBe(
      "<table>" +
        "<tr><th>品名</th><th>勘定科目</th><th>空白</th></tr>" +
        "<tr><td>ChatGPT Plus</td><td>通信費</td><td></td></tr>" +
        "</table>"
    );
  });

  it("罫線テーブルを明示指定でHTMLテーブルに変換する", () => {
    const data = loadTestData("boxdraw-basic.txt");
    const result = toHtmlTable(data, true, "boxdraw");

    expect(result).toBe(
      "<table>" +
        "<tr><th>A</th><th>B</th><th>C</th></tr>" +
        "<tr><td>1</td><td>2</td><td>3</td></tr>" +
        "</table>"
    );
  });
});
