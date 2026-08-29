import { describe, expect, it } from "vitest";
import {
  formatUrlCitationSources,
  sanitizeCitationArtifacts,
} from "../../src/utils/citations";

describe("citation rendering", () => {
  it("removes leaked internal web citation markers", () => {
    expect(
      sanitizeCitationArtifacts(
        "验证报告。\uE200cite\uE202turn0search0\uE201",
      ),
    ).toBe("验证报告。");
  });

  it("removes replacement-character citation markers from compatible APIs", () => {
    expect(
      sanitizeCitationArtifacts("验证报告。��cite��turn0search0��"),
    ).toBe("验证报告。");
  });

  it("formats unique HTTP citations as Markdown sources", () => {
    expect(
      formatUrlCitationSources([
        { url: "https://example.test/paper", title: "Example [paper]" },
        { url: "https://example.test/paper", title: "Duplicate" },
        { url: "javascript:alert(1)", title: "Unsafe" },
      ]),
    ).toBe(
      "\n\n### 来源\n\n1. [Example paper](https://example.test/paper)",
    );
  });
});
