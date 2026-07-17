import { describe, expect, it } from "vitest";
import {
  compareRecords,
  escapeHtml,
  getLeaderboardPageCount,
  getPagedLeaderboardRecords,
  getSortedLeaderboardRecords,
  getSortIndicator,
  getUniquePlayers
} from "../src/leaderboard-core.js";

const records = [
  { player: "Superman", moves: 66, time: 26 },
  { player: "Maksim", moves: 92, time: 45 },
  { player: "Solomisha", moves: 74, time: 47 },
  { player: "Superman", moves: 98, time: 53 }
];

describe("leaderboard-core", () => {
  it("escapes html", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("returns active sort indicator", () => {
    expect(getSortIndicator({ key: "moves", direction: "asc" }, "moves")).toBe("▲");
    expect(getSortIndicator({ key: "moves", direction: "desc" }, "moves")).toBe("▼");
    expect(getSortIndicator({ key: "moves", direction: "asc" }, "player")).toBe("");
  });

  it("sorts by moves ascending and descending", () => {
    const asc = getSortedLeaderboardRecords(records, { key: "moves", direction: "asc" });
    const desc = getSortedLeaderboardRecords(records, { key: "moves", direction: "desc" });

    expect(asc.map((record) => record.moves)).toEqual([66, 74, 92, 98]);
    expect(desc.map((record) => record.moves)).toEqual([98, 92, 74, 66]);
  });

  it("sorts by time ascending and descending", () => {
    const asc = getSortedLeaderboardRecords(records, { key: "time", direction: "asc" });
    const desc = getSortedLeaderboardRecords(records, { key: "time", direction: "desc" });

    expect(asc.map((record) => record.time)).toEqual([26, 45, 47, 53]);
    expect(desc.map((record) => record.time)).toEqual([53, 47, 45, 26]);
  });

  it("sorts by player ascending and descending", () => {
    const mixedPlayers = [
      { player: "Zed", moves: 90, time: 40 },
      { player: "Anna", moves: 91, time: 41 },
      { player: "Boris", moves: 92, time: 42 }
    ];

    const asc = getSortedLeaderboardRecords(mixedPlayers, { key: "player", direction: "asc" });
    const desc = getSortedLeaderboardRecords(mixedPlayers, { key: "player", direction: "desc" });

    expect(asc.map((record) => record.player)).toEqual(["Anna", "Boris", "Zed"]);
    expect(desc.map((record) => record.player)).toEqual(["Zed", "Boris", "Anna"]);
  });

  it("uses time as tie-breaker when sorting by moves", () => {
    const tiedRecords = [
      { player: "Player A", moves: 40, time: 32 },
      { player: "Player B", moves: 40, time: 28 },
      { player: "Player C", moves: 41, time: 10 }
    ];

    const sorted = getSortedLeaderboardRecords(tiedRecords, { key: "moves", direction: "asc" });
    expect(sorted.map((record) => record.player)).toEqual(["Player B", "Player A", "Player C"]);
  });

  it("uses moves as tie-breaker when sorting by time", () => {
    const tiedRecords = [
      { player: "Player A", moves: 55, time: 30 },
      { player: "Player B", moves: 48, time: 30 },
      { player: "Player C", moves: 42, time: 29 }
    ];

    const sorted = getSortedLeaderboardRecords(tiedRecords, { key: "time", direction: "asc" });
    expect(sorted.map((record) => record.player)).toEqual(["Player C", "Player B", "Player A"]);
  });

  it("uses player name as the final tie-breaker", () => {
    const tiedRecords = [
      { player: "Charlie", moves: 40, time: 30 },
      { player: "Alice", moves: 40, time: 30 },
      { player: "Bob", moves: 40, time: 30 }
    ];

    const sorted = getSortedLeaderboardRecords(tiedRecords, { key: "moves", direction: "asc" });
    expect(sorted.map((record) => record.player)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("does not mutate source array when sorting", () => {
    const original = [
      { player: "B", moves: 3, time: 9 },
      { player: "A", moves: 1, time: 2 }
    ];

    const sorted = getSortedLeaderboardRecords(original, { key: "moves", direction: "asc" });

    expect(original.map((record) => record.player)).toEqual(["B", "A"]);
    expect(sorted.map((record) => record.player)).toEqual(["A", "B"]);
  });

  it("compares players with direction awareness", () => {
    const first = { player: "Anna", moves: 50, time: 40 };
    const second = { player: "Boris", moves: 50, time: 40 };

    expect(compareRecords(first, second, { key: "player", direction: "asc" })).toBeLessThan(0);
    expect(compareRecords(first, second, { key: "player", direction: "desc" })).toBeGreaterThan(0);
  });

  it("uses fallback comparison when sort key values are equal", () => {
    const first = { player: "Beta", moves: 50, time: 20 };
    const second = { player: "Alpha", moves: 50, time: 20 };

    expect(compareRecords(first, second, { key: "moves", direction: "asc" })).toBeGreaterThan(0);
  });

  it("calculates page count", () => {
    expect(getLeaderboardPageCount(records, 10)).toBe(1);
    expect(getLeaderboardPageCount(new Array(21).fill(records[0]), 10)).toBe(3);
    expect(getLeaderboardPageCount([], 10)).toBe(1);
    expect(getLeaderboardPageCount(records, records.length)).toBe(1);
    expect(getLeaderboardPageCount(records, 50)).toBe(1);
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

  it("normalizes pagination bounds", () => {
    const manyRecords = Array.from({ length: 12 }, (_, index) => ({
      player: `P${index + 1}`,
      moves: index + 1,
      time: index + 1
    }));

    const pageZero = getPagedLeaderboardRecords(manyRecords, 0, 10);
    const pageTooHigh = getPagedLeaderboardRecords(manyRecords, 99, 10);
    const exactPageSize = getPagedLeaderboardRecords(records, 1, records.length);
    const oversizedPageSize = getPagedLeaderboardRecords(records, 1, 50);
    const singleItemPages = getPagedLeaderboardRecords(manyRecords, 3, 1);

    expect(pageZero.page).toBe(1);
    expect(pageZero.startIndex).toBe(0);
    expect(pageTooHigh.page).toBe(2);
    expect(pageTooHigh.records).toHaveLength(2);
    expect(exactPageSize.records).toHaveLength(records.length);
    expect(oversizedPageSize.records).toHaveLength(records.length);
    expect(singleItemPages.page).toBe(3);
    expect(singleItemPages.records[0].player).toBe("P3");
  });

  it("returns unique players and filters empty values", () => {
    const mixedRecords = [
      { player: "Superman", moves: 66, time: 26 },
      { player: "", moves: 67, time: 27 },
      { player: "Maksim", moves: 68, time: 28 },
      { player: "Superman", moves: 69, time: 29 },
      { player: null, moves: 70, time: 30 },
      { player: undefined, moves: 71, time: 31 }
    ];

    expect(getUniquePlayers(mixedRecords)).toEqual(["Superman", "Maksim"]);
  });

  it("works with an empty leaderboard collection", () => {
    expect(getSortedLeaderboardRecords([], { key: "moves", direction: "asc" })).toEqual([]);
    expect(getPagedLeaderboardRecords([], 1, 10)).toEqual({
      page: 1,
      totalPages: 1,
      startIndex: 0,
      records: []
    });
    expect(getUniquePlayers([])).toEqual([]);
  });
});
