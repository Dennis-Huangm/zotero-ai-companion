import { beforeEach, describe, expect, it } from "vitest";
import {
  chatHistoryPath,
  deleteChatThread,
  initializeChatHistoryStorage,
  loadAllChatThreads,
  loadChatMessages,
  loadChatThreads,
  saveChatMessages,
} from "../../src/settings/chat-history";

let stored = "{}";

beforeEach(() => {
  stored = "{}";
  Object.defineProperty(globalThis, "Zotero", {
    configurable: true,
    value: {
      Profile: { dir: "/tmp/zotero-profile" },
      File: {
        getContentsAsync: async () => stored,
        putContentsAsync: async (_path: string, contents: string) => {
          stored = contents;
        },
      },
    },
  });
});

describe("chat history", () => {
  it("preserves image attachments and agent context", async () => {
    await saveChatMessages(42, [
      {
        role: "user",
        content: "分析图片",
        images: [
          {
            id: "img-1",
            name: "shot.png",
            mediaType: "image/png",
            dataUrl: "data:image/png;base64,abc",
            size: 3,
          },
        ],
        context: {
          selectedText: "paper text",
          toolCalls: [
            {
              name: "zotero_get_current_item",
              status: "completed",
              summary: "读取当前条目",
            },
          ],
        },
      },
    ]);

    expect(await loadChatMessages(42)).toEqual([
      {
        role: "user",
        content: "分析图片",
        images: [
          {
            id: "img-1",
            name: "shot.png",
            mediaType: "image/png",
            dataUrl: "data:image/png;base64,abc",
            size: 3,
          },
        ],
        context: {
          selectedText: "paper text",
          toolCalls: [
            {
              name: "zotero_get_current_item",
              status: "completed",
              summary: "读取当前条目",
            },
          ],
        },
      },
    ]);
  });

  it("preserves assistant annotation draft color", async () => {
    await saveChatMessages(42, [
      {
        role: "assistant",
        content: "解释正文",
        annotationDraft: {
          comment: "- 核心问题",
          color: "#ff6666",
          snapshot: {
            text: "selected sentence",
            attachmentID: 7,
            annotation: { position: { pageIndex: 0, rects: [] } },
          },
          state: { kind: "idle" },
          textState: { kind: "saved", annotationID: 8, savedAt: 1234 },
        },
      },
    ]);

    expect(await loadChatMessages(42)).toEqual([
      {
        role: "assistant",
        content: "解释正文",
        annotationDraft: {
          comment: "- 核心问题",
          color: "#ff6666",
          snapshot: {
            text: "selected sentence",
            attachmentID: 7,
            annotation: { position: { pageIndex: 0, rects: [] } },
          },
          state: { kind: "idle" },
          textState: { kind: "saved", annotationID: 8, savedAt: 1234 },
        },
      },
    ]);
  });

  it("preserves local task queue metadata", async () => {
    await saveChatMessages(42, [
      {
        role: "user",
        content: "解释这句话",
        task: {
          id: "task-1",
          kind: "selection",
          title: "选中文字提问",
          promptPreview: "While most robotic learning systems...",
          createdAt: 100,
          completedAt: 200,
          viewedAt: 300,
          pdfSelection: {
            attachmentID: 7,
            selectedText: "While most robotic learning systems...",
            pageIndex: 0,
            pageLabel: "1",
            position: { pageIndex: 0, rects: [[1, 2, 3, 4]] },
          },
        },
      },
    ]);

    expect(await loadChatMessages(42)).toEqual([
      {
        role: "user",
        content: "解释这句话",
        task: {
          id: "task-1",
          kind: "selection",
          title: "选中文字提问",
          promptPreview: "While most robotic learning systems...",
          createdAt: 100,
          completedAt: 200,
          viewedAt: 300,
          pdfSelection: {
            attachmentID: 7,
            selectedText: "While most robotic learning systems...",
            pageIndex: 0,
            pageLabel: "1",
            position: { pageIndex: 0, rects: [[1, 2, 3, 4]] },
          },
        },
      },
    ]);
  });

  it("stores multiple chat threads for the same Zotero item", async () => {
    await saveChatMessages(42, [{ role: "user", content: "default chat" }]);
    await saveChatMessages(42, [{ role: "user", content: "parallel chat" }], {
      threadID: "chat-second",
      title: "第二个对话",
      createdAt: "2026-05-01T00:00:00.000Z",
    });

    expect(await loadChatMessages(42)).toEqual([
      { role: "user", content: "default chat" },
    ]);
    expect(await loadChatMessages(42, "chat-second")).toEqual([
      { role: "user", content: "parallel chat" },
    ]);
    const threads = await loadChatThreads(42);
    expect(threads.map((thread) => thread.threadID)).toEqual([
      "main",
      "chat-second",
    ]);
    expect(threads[1].title).toBe("第二个对话");
  });

  it("persists a renamed conversation title", async () => {
    const messages = [{ role: "user" as const, content: "original prompt" }];
    await saveChatMessages(42, messages, {
      threadID: "renamed-chat",
      title: "原名称",
      createdAt: "2026-08-23T00:00:00.000Z",
    });
    await saveChatMessages(42, messages, {
      threadID: "renamed-chat",
      title: "自定义名称",
      createdAt: "2026-08-23T00:00:00.000Z",
    });

    const renamed = (await loadChatThreads(42)).find(
      (thread) => thread.threadID === "renamed-chat",
    );
    expect(renamed?.title).toBe("自定义名称");
  });

  it("deletes only the selected chat thread", async () => {
    await saveChatMessages(42, [{ role: "user", content: "default chat" }]);
    await saveChatMessages(42, [{ role: "user", content: "parallel chat" }], {
      threadID: "chat-second",
    });

    await deleteChatThread(42, "chat-second");

    expect(await loadChatMessages(42)).toHaveLength(1);
    expect(await loadChatMessages(42, "chat-second")).toEqual([]);
    expect(
      (await loadChatThreads(42)).map((thread) => thread.threadID),
    ).toEqual(["main"]);
  });

  it("stores history in the Zotero data directory when available", async () => {
    const writes: string[] = [];
    Object.defineProperty(globalThis, "Zotero", {
      configurable: true,
      value: {
        Profile: { dir: "/tmp/zotero-profile" },
        DataDirectory: { dir: "/tmp/zotero-data" },
        File: {
          getContentsAsync: async () => stored,
          putContentsAsync: async (path: string, contents: string) => {
            writes.push(path);
            stored = contents;
          },
        },
      },
    });

    await saveChatMessages(42, [{ role: "user", content: "persist me" }]);

    expect(chatHistoryPath()).toBe(
      "/tmp/zotero-data/zotero-ai-sidebar-chat-history.json",
    );
    expect(writes).toEqual([
      "/tmp/zotero-data/zotero-ai-sidebar-chat-history.json",
    ]);
  });

  it("uses native Windows separators for the history path", () => {
    Object.defineProperty(globalThis, "Zotero", {
      configurable: true,
      value: {
        Profile: { dir: "C:\\Users\\HUANG\\Profile" },
        DataDirectory: { dir: "C:\\Users\\HUANG\\Zotero" },
        File: {
          getContentsAsync: async () => "{}",
          putContentsAsync: async () => undefined,
        },
      },
    });

    expect(chatHistoryPath()).toBe(
      "C:\\Users\\HUANG\\Zotero\\zotero-ai-sidebar-chat-history.json",
    );
  });

  it("creates and verifies the history file during plugin startup", async () => {
    const writes: string[] = [];
    Object.defineProperty(globalThis, "Zotero", {
      configurable: true,
      value: {
        Profile: { dir: "/tmp/zotero-profile" },
        DataDirectory: { dir: "/tmp/zotero-data" },
        File: {
          getContentsAsync: async () => stored,
          putContentsAsync: async (path: string, contents: string) => {
            writes.push(path);
            stored = contents;
          },
        },
      },
    });

    await expect(initializeChatHistoryStorage()).resolves.toBe(
      "/tmp/zotero-data/zotero-ai-sidebar-chat-history.json",
    );
    expect(writes).toEqual([
      "/tmp/zotero-data/zotero-ai-sidebar-chat-history.json",
    ]);
    expect(JSON.parse(stored)).toEqual({});
  });

  it("migrates profile-local history to the Zotero data directory", async () => {
    const primary = "/tmp/zotero-data/zotero-ai-sidebar-chat-history.json";
    const legacy = "/tmp/zotero-profile/zotero-ai-sidebar-chat-history.json";
    const legacyContents = JSON.stringify({
      "item:42": {
        itemID: 42,
        updatedAt: "2026-08-22T12:00:00.000Z",
        messages: [{ role: "user", content: "legacy chat" }],
      },
    });
    const writes = new Map<string, string>();
    Object.defineProperty(globalThis, "Zotero", {
      configurable: true,
      value: {
        Profile: { dir: "/tmp/zotero-profile" },
        DataDirectory: { dir: "/tmp/zotero-data" },
        File: {
          getContentsAsync: async (path: string) => {
            if (path === legacy) return legacyContents;
            throw new Error("not found");
          },
          putContentsAsync: async (path: string, contents: string) => {
            writes.set(path, contents);
          },
        },
      },
    });

    expect((await loadAllChatThreads()).map((thread) => thread.title)).toEqual([
      "legacy chat",
    ]);
    expect(JSON.parse(writes.get(primary)!)).toEqual(
      JSON.parse(legacyContents),
    );
  });

  it("falls back to profile storage when the data directory is read-only", async () => {
    const primary = "/tmp/zotero-data/zotero-ai-sidebar-chat-history.json";
    const legacy = "/tmp/zotero-profile/zotero-ai-sidebar-chat-history.json";
    const writes: string[] = [];
    Object.defineProperty(globalThis, "Zotero", {
      configurable: true,
      value: {
        Profile: { dir: "/tmp/zotero-profile" },
        DataDirectory: { dir: "/tmp/zotero-data" },
        File: {
          getContentsAsync: async () => {
            throw new Error("not found");
          },
          putContentsAsync: async (path: string, contents: string) => {
            if (path === primary) throw new Error("read only");
            writes.push(path);
            stored = contents;
          },
        },
      },
    });

    await saveChatMessages(42, [{ role: "user", content: "fallback chat" }]);
    expect(writes).toEqual([legacy]);
  });

  it("loads recent threads across different Zotero items", async () => {
    await saveChatMessages(42, [{ role: "user", content: "paper one" }]);
    await saveChatMessages(84, [{ role: "user", content: "paper two" }]);

    const threads = await loadAllChatThreads();
    expect(new Set(threads.map((thread) => thread.itemID))).toEqual(
      new Set([42, 84]),
    );
  });
});
