import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderMount } from "../../src/modules/sidebar";
import {
  saveChatMessages,
  loadChatThreads,
} from "../../src/settings/chat-history";

let stored = "{}";
let mount: HTMLDivElement;

beforeEach(() => {
  stored = "{}";
  vi.stubGlobal("Zotero", {
    Profile: { dir: "/tmp/history-navigation" },
    Prefs: {
      get: (key: string) =>
        key.endsWith(".presets")
          ? JSON.stringify([
              {
                id: "test",
                name: "Test",
                provider: "openai",
                apiKey: "test-key",
                model: "test-model",
              },
            ])
          : undefined,
      set: () => {},
    },
    Utilities: { randomString: () => Math.random().toString(36).slice(2, 7) },
    Items: { get: () => ({ getField: () => "Test paper" }) },
    File: {
      getContentsAsync: async () => stored,
      putContentsAsync: async (_path: string, content: string) => {
        stored = content;
      },
    },
  });
  window.confirm = vi.fn(() => true);
  mount = document.createElement("div");
  document.body.append(mount);
});

afterEach(() => {
  mount?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function clickText(text: string) {
  const button = Array.from(mount.querySelectorAll("button")).find(
    (button) => button.textContent === text,
  );
  expect(button, `Missing button: ${text}`).toBeTruthy();
  button!.click();
}

describe("returning to chat after deleting the active history", () => {
  it.each([true, false])(
    "restores the latest remaining chat, or creates one (remaining=%s)",
    async (remaining) => {
      if (remaining) {
        await saveChatMessages(
          42,
          [{ role: "user", content: "Older conversation" }],
          { threadID: "older" },
        );
      }
      await saveChatMessages(
        42,
        [{ role: "user", content: "Deleted conversation" }],
        { threadID: "active" },
      );
      await saveChatMessages(
        84,
        [{ role: "user", content: "Other paper conversation" }],
        { threadID: "other-paper" },
      );
      renderMount(mount, 42);
      await vi.waitFor(() =>
        expect(mount.querySelector(".input-row textarea")).not.toBeNull(),
      );
      clickText("历史记录");
      await vi.waitFor(() =>
        expect(mount.querySelectorAll(".zai-history-page-item").length).toBe(
          remaining ? 2 : 1,
        ),
      );
      const activeRow = Array.from(
        mount.querySelectorAll(".zai-history-page-item"),
      ).find((row) => row.textContent?.includes("Deleted conversation"))!;
      (
        activeRow.querySelector(
          ".zai-history-page-item-open",
        ) as HTMLButtonElement
      ).click();
      expect(mount.querySelector(".messages")?.textContent).toContain(
        "Deleted conversation",
      );
      clickText("历史记录");
      await vi.waitFor(() =>
        expect(mount.querySelectorAll(".zai-history-page-item").length).toBe(
          remaining ? 2 : 1,
        ),
      );
      const row = Array.from(
        mount.querySelectorAll(".zai-history-page-item"),
      ).find((row) => row.textContent?.includes("Deleted conversation"))!;
      (row.querySelector(".zai-history-delete") as HTMLButtonElement).click();
      await vi.waitFor(() =>
        expect(mount.querySelectorAll(".zai-history-page-item").length).toBe(
          remaining ? 1 : 0,
        ),
      );
      clickText("返回对话");
      await vi.waitFor(() =>
        expect(mount.querySelector(".input-row textarea")).not.toBeNull(),
      );
      expect(mount.textContent).not.toContain("正在恢复历史会话");
      expect(mount.textContent).not.toContain("Deleted conversation");
      expect(mount.textContent).not.toContain("Other paper conversation");
      expect(mount.textContent?.includes("Older conversation")).toBe(remaining);
      expect(
        (await loadChatThreads(42)).map((thread) => thread.threadID),
      ).not.toContain("active");
    },
  );
});
