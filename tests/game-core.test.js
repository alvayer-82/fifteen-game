import { describe, expect, it } from "vitest";
import {
  areAdjacent,
  countInversions,
  createSolvedTiles,
  formatTime,
  isSolved,
  isSolvable,
  swapTiles
} from "../src/game-core.js";

describe("game-core", () => {
  it("formats time as mm:ss", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
  });

  it("creates solved tiles", () => {
    expect(createSolvedTiles()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
  });

  it("detects adjacent tiles", () => {
    expect(areAdjacent(0, 1)).toBe(true);
    expect(areAdjacent(0, 4)).toBe(true);
    expect(areAdjacent(0, 5)).toBe(false);
  });

  it("detects solved state", () => {
    expect(isSolved(createSolvedTiles())).toBe(true);
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0])).toBe(false);
  });

  it("counts inversions", () => {
    expect(countInversions([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe(0);
    expect(countInversions([2, 1, 3, 4, 5, 6, 7, 8, 0])).toBe(1);
  });

  it("checks solvable boards", () => {
    expect(isSolvable(createSolvedTiles())).toBe(true);
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0])).toBe(false);
  });

  it("swaps tiles without mutating original array", () => {
    const original = createSolvedTiles();
    const swapped = swapTiles(original, 14, 15);

    expect(original[14]).toBe(15);
    expect(original[15]).toBe(0);
    expect(swapped[14]).toBe(0);
    expect(swapped[15]).toBe(15);
  });
});
