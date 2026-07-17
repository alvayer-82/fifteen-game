import { describe, expect, it } from "vitest";
import {
  areAdjacent,
  countInversions,
  createSolvedTiles,
  formatTime,
  getColumn,
  getRow,
  isSolved,
  isSolvable,
  swapTiles
} from "../src/game-core.js";

describe("game-core", () => {
  it("formats time as mm:ss", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(605)).toBe("10:05");
  });

  it("creates solved tiles for 4x4 and 3x3 boards", () => {
    expect(createSolvedTiles()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
    expect(createSolvedTiles(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  });

  it("creates tiles with unique values and exactly one empty cell", () => {
    const tiles = createSolvedTiles();
    const uniqueValues = new Set(tiles);

    expect(tiles).toHaveLength(16);
    expect(uniqueValues.size).toBe(16);
    expect(tiles.filter((value) => value === 0)).toHaveLength(1);
    expect(Math.min(...tiles)).toBe(0);
    expect(Math.max(...tiles)).toBe(15);
  });

  it("calculates row and column for edge indexes", () => {
    expect(getRow(0)).toBe(0);
    expect(getColumn(0)).toBe(0);
    expect(getRow(15)).toBe(3);
    expect(getColumn(15)).toBe(3);
    expect(getRow(8, 3)).toBe(2);
    expect(getColumn(8, 3)).toBe(2);
  });

  it("detects adjacent tiles and rejects diagonal or row-wrapping moves", () => {
    expect(areAdjacent(0, 1)).toBe(true);
    expect(areAdjacent(0, 4)).toBe(true);
    expect(areAdjacent(0, 5)).toBe(false);
    expect(areAdjacent(3, 4)).toBe(false);
    expect(areAdjacent(7, 8)).toBe(false);
    expect(areAdjacent(11, 12)).toBe(false);
    expect(areAdjacent(6, 10)).toBe(true);
  });

  it("detects solved and unsolved states", () => {
    expect(isSolved(createSolvedTiles())).toBe(true);
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0])).toBe(false);
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15])).toBe(false);
    expect(isSolved(createSolvedTiles(3))).toBe(true);
  });

  it("counts inversions", () => {
    expect(countInversions([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe(0);
    expect(countInversions([2, 1, 3, 4, 5, 6, 7, 8, 0])).toBe(1);
    expect(countInversions([8, 7, 6, 5, 4, 3, 2, 1, 0])).toBe(28);
  });

  it("checks solvable boards for 4x4 and 3x3 sizes", () => {
    expect(isSolvable(createSolvedTiles())).toBe(true);
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0])).toBe(false);
    expect(isSolvable(createSolvedTiles(3), 3)).toBe(true);
    expect(isSolvable([1, 2, 3, 4, 5, 6, 8, 7, 0], 3)).toBe(false);
  });

  it("uses empty row position for even-sized solvability checks", () => {
    const solvableBoard = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 13, 14, 15];
    const unsolvableBoard = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 14, 13, 15];

    expect(isSolvable(solvableBoard)).toBe(true);
    expect(isSolvable(unsolvableBoard)).toBe(false);
  });

  it("swaps tiles without mutating original array", () => {
    const original = createSolvedTiles();
    const swapped = swapTiles(original, 14, 15);

    expect(original[14]).toBe(15);
    expect(original[15]).toBe(0);
    expect(swapped[14]).toBe(0);
    expect(swapped[15]).toBe(15);
    expect(swapped).toHaveLength(original.length);
  });

  it("preserves board values after swapping arbitrary indexes", () => {
    const original = createSolvedTiles();
    const swapped = swapTiles(original, 3, 10);

    expect(swapped[3]).toBe(11);
    expect(swapped[10]).toBe(4);
    expect([...swapped].sort((a, b) => a - b)).toEqual([...original].sort((a, b) => a - b));
  });

  it("keeps board unchanged when swapping the same index", () => {
    const original = createSolvedTiles();
    const swapped = swapTiles(original, 5, 5);

    expect(swapped).toEqual(original);
    expect(swapped).not.toBe(original);
  });
});
