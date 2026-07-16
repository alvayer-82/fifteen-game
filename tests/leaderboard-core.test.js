import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  getLeaderboardPageCount,
  getPagedLeaderboardRecords,
  getSortedLeaderboardRecords,
  getSortIndicator,
  getUniquePlayers
} from "../src/leaderboard-core.js";

const records = [
  { player: "Супермэн", moves: 66, time: 26 },
  { player: "Maksim", moves: 92, time: 45 },
  { player: "Соломиша", moves: 74, time: 47 },
  { player: "Супермэн", moves: 98, time: 53 }
];

describe("leaderboard-core", () => {
  it("escapes html", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("returns active sort indicator", () => {
    expect(getSortIndicator({ key: "moves", direction: "asc" }, "moves")).toBe("▲");
    expect(getSortIndicator({ key: "moves", direction: "desc" }, "moves")).toBe("▼");
    expect(getSortIndicator({ key: "moves", direction: "asc" }, "player")).toBe("");
  });

  it("sorts by moves ascending by default", () => {
    const sorted = getSortedLeaderboardRecords(records, { key: "moves", direction: "asc" });
    expect(sorted.map((record) => record.moves)).toEqual([66, 74, 92, 98]);
  });

  it("sorts by player descending", () => {
    const sorted = getSortedLeaderboardRecords(records, { key: "player", direction: "desc" });
    expect(sorted.map((record) => record.player)).toEqual([
      "Maksim",
      "Супермэн",
      "Супермэн",
      "Соломиша"
    ]);
  });

  it("calculates page count", () => {
    expect(getLeaderboardPageCount(records, 10)).toBe(1);
    expect(getLeaderboardPageCount(new Array(21).fill(records[0]), 10)).toBe(3);
  });

  it("returns paged records with normalized page", () => {
    const manyRecords = Array.from({ length: 12 }, (_, index) => ({
      player: `P${index + 1}`,
      moves: index + 1,
      time: index + 1
    }));

    const page = getPagedLeaderboardRecords(manyRecords, 2, 10);
    expect(page.page).toBe(2);
    expect(page.records).toHaveLength(2);
    expect(page.startIndex).toBe(10);
  });

  it("returns unique players", () => {
    expect(getUniquePlayers(records)).toEqual(["Супермэн", "Maksim", "Соломиша"]);
  });
});
