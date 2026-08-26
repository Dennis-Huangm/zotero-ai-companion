import { describe, expect, it } from "vitest";
import { renderMarkdownInto } from "../../src/modules/sidebar";

describe("renderMarkdownInto tables", () => {
  it("renders a GFM table as semantic DOM instead of flattened pipe text", () => {
    const root = document.createElement("div");
    renderMarkdownInto(
      root,
      [
        "| 方法 | 视觉完整性 | 运动平滑度 | 指令遵循 |",
        "| --- | ---: | ---: | ---: |",
        "| LiveSketch | 2.15 | 2.43 | 2.12 |",
        "| GPT-5.2 | 3.35 | 3.76 | 3.55 |",
        "| VAnim | **4.62** | **4.48** | **4.55** |",
        "",
        "主观结果与方法预期一致。",
      ].join("\n"),
    );

    const table = root.querySelector("table");
    expect(table).not.toBeNull();
    expect(
      Array.from(table!.querySelectorAll("th"), (cell) => cell.textContent),
    ).toEqual(["方法", "视觉完整性", "运动平滑度", "指令遵循"]);
    expect(table!.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(
      Array.from(
        table!.querySelectorAll("tbody tr:last-child strong"),
        (cell) => cell.textContent,
      ),
    ).toEqual(["4.62", "4.48", "4.55"]);
    expect(root.lastElementChild?.tagName).toBe("P");
    expect(root.lastElementChild?.textContent).toBe("主观结果与方法预期一致。");
  });

  it("renders horizontal rules, italics, and escaped stars", () => {
    const root = document.createElement("div");
    renderMarkdownInto(
      root,
      [
        "上一节内容。",
        "",
        "---",
        "",
        "## 表 S2：用户研究结果",
        "",
        "*来源：Liang et al., 2026, Table S2.*",
        "",
        "\\*这一对星号应保留\\*",
      ].join("\n"),
    );

    expect(root.querySelectorAll("hr")).toHaveLength(1);
    expect(root.querySelector("em")?.textContent).toBe(
      "来源：Liang et al., 2026, Table S2.",
    );
    expect(root.lastElementChild?.textContent).toBe("*这一对星号应保留*");
    expect(root.lastElementChild?.querySelector("em")).toBeNull();
  });

  it("does not confuse bold text, list markers, or multiplication with italics", () => {
    const root = document.createElement("div");
    renderMarkdownInto(root, ["**粗体** 和 2 * 3", "", "* 列表项"].join("\n"));

    expect(root.querySelector("strong")?.textContent).toBe("粗体");
    expect(root.querySelector("em")).toBeNull();
    expect(root.querySelector("li")?.textContent).toBe("列表项");
  });

  it("preserves explicit numbering when paragraphs split an ordered list", () => {
    const root = document.createElement("div");
    renderMarkdownInto(
      root,
      [
        "1. **编译失败时：LaTeX 编译器错误信息**",
        "",
        "用于定位 TikZ/LaTeX 代码的语法问题。",
        "",
        "2. **编译成功时：渲染出的图像**",
        "",
        "模型根据视觉差异判断编辑是否正确。",
      ].join("\n"),
    );

    const lists = Array.from(root.querySelectorAll("ol"));
    expect(lists).toHaveLength(2);
    expect(lists.map((list) => list.start)).toEqual([1, 2]);
    expect(
      lists.map((list) => (list.querySelector("li") as HTMLLIElement).value),
    ).toEqual([1, 2]);
  });
});
