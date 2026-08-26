import { beforeEach, describe, expect, it } from "vitest";
import { translateDebugLogPath } from "../../src/translate/debug-log";

beforeEach(() => {
  Object.defineProperty(globalThis, "Zotero", {
    configurable: true,
    value: {
      DataDirectory: { dir: "C:\\Users\\HUANG\\Zotero" },
      Profile: { dir: "C:\\Users\\HUANG\\Profile" },
    },
  });
});

describe("translateDebugLogPath", () => {
  it("stores debug output in the Windows Zotero data directory", () => {
    expect(translateDebugLogPath()).toBe(
      "C:\\Users\\HUANG\\Zotero\\zai_translate_debug.log",
    );
  });

  it("falls back to the Zotero profile directory", () => {
    Object.defineProperty(globalThis, "Zotero", {
      configurable: true,
      value: { Profile: { dir: "C:\\Users\\HUANG\\Profile" } },
    });
    expect(translateDebugLogPath()).toBe(
      "C:\\Users\\HUANG\\Profile\\zai_translate_debug.log",
    );
  });
});
