import { describe, expect, it } from "vitest";
import { joinPlatformPath } from "../../src/utils/file-path";

describe("joinPlatformPath", () => {
  it("uses Windows separators for Windows directories", () => {
    expect(joinPlatformPath("C:\\Users\\HUANG\\Zotero", "history.json")).toBe(
      "C:\\Users\\HUANG\\Zotero\\history.json",
    );
  });

  it("uses POSIX separators for POSIX directories", () => {
    expect(joinPlatformPath("/home/user/Zotero", "history.json")).toBe(
      "/home/user/Zotero/history.json",
    );
  });

  it("does not duplicate a trailing separator", () => {
    expect(joinPlatformPath("C:\\Zotero\\", "history.json")).toBe(
      "C:\\Zotero\\history.json",
    );
    expect(joinPlatformPath("/tmp/", "history.json")).toBe("/tmp/history.json");
  });
});
