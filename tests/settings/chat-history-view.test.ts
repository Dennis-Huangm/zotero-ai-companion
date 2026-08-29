import { describe, expect, it } from "vitest";
import {
  filterChatHistorySnapshots,
  latestChatThreadSnapshot,
  type ChatThreadSnapshot,
} from "../../src/settings/chat-history";

const threads: ChatThreadSnapshot[] = [
  {
    itemID: 42,
    threadID: "paper-a",
    title: "论文 A",
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T01:00:00.000Z",
    messages: [{ role: "user", content: "A" }],
  },
  {
    itemID: 84,
    threadID: "paper-b",
    title: "论文 B",
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T02:00:00.000Z",
    messages: [{ role: "user", content: "B" }],
  },
  {
    itemID: null,
    threadID: "global",
    title: "普通对话",
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T03:00:00.000Z",
    messages: [{ role: "user", content: "global" }],
  },
];

describe("filterChatHistorySnapshots", () => {
  it("returns every conversation in all scope", () => {
    expect(filterChatHistorySnapshots(threads, "all", 42)).toEqual(threads);
  });

  it("returns only conversations for the current paper", () => {
    expect(
      filterChatHistorySnapshots(threads, "current", 42).map(
        (thread) => thread.threadID,
      ),
    ).toEqual(["paper-a"]);
  });

  it("supports global conversations when there is no current paper", () => {
    expect(
      filterChatHistorySnapshots(threads, "current", null).map(
        (thread) => thread.threadID,
      ),
    ).toEqual(["global"]);
  });
});

describe("latestChatThreadSnapshot", () => {
  it("selects the most recently updated conversation for a paper", () => {
    const samePaper = [
      threads[0],
      {
        ...threads[0],
        threadID: "paper-a-latest",
        updatedAt: "2026-08-23T04:00:00.000Z",
      },
    ];

    expect(latestChatThreadSnapshot(samePaper)?.threadID).toBe(
      "paper-a-latest",
    );
  });

  it("returns null when the paper has no history", () => {
    expect(latestChatThreadSnapshot([])).toBeNull();
  });
});
