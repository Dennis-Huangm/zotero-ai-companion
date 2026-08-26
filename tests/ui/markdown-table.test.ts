import { describe, expect, it } from "vitest";
import { parseMarkdownTable } from "../../src/ui/markdown-table";

describe("parseMarkdownTable", () => {
  it("parses the user-research table shown in chat", () => {
    const lines = [
      "| 方法 | 视觉完整性 | 运动平滑度 | 指令遵循 |",
      "| --- | :---: | ---: | :--- |",
      "| LiveSketch | 2.15 | 2.43 | 2.12 |",
      "| GPT-5.2 | 3.35 | 3.76 | 3.55 |",
      "| VAnim | **4.62** | **4.48** | **4.55** |",
      "",
      "主观结果与方法预期一致。",
    ];

    expect(parseMarkdownTable(lines, 0)).toEqual({
      header: ["方法", "视觉完整性", "运动平滑度", "指令遵循"],
      alignments: [null, "center", "right", "left"],
      rows: [
        ["LiveSketch", "2.15", "2.43", "2.12"],
        ["GPT-5.2", "3.35", "3.76", "3.55"],
        ["VAnim", "**4.62**", "**4.48**", "**4.55**"],
      ],
      nextLineIndex: 5,
    });
  });

  it("preserves escaped pipes and pipes inside inline code", () => {
    const table = parseMarkdownTable(
      [
        "| expression | result |",
        "| --- | --- |",
        "| a \\| b | `left | right` |",
      ],
      0,
    );

    expect(table?.rows).toEqual([["a | b", "`left | right`"]]);
  });

  it("waits for a complete delimiter row during streaming", () => {
    expect(parseMarkdownTable(["| 方法 | 分数 |"], 0)).toBeNull();
    expect(
      parseMarkdownTable(["| 方法 | 分数 |", "| -- | --- |"], 0),
    ).toBeNull();
  });

  it("pads short rows and ignores cells beyond the header width", () => {
    const table = parseMarkdownTable(
      ["name | score", "--- | ---:", "| short |", "| extra | 5 | ignored |"],
      0,
    );

    expect(table?.rows).toEqual([
      ["short", ""],
      ["extra", "5"],
    ]);
    expect(table?.nextLineIndex).toBe(4);
  });
});
