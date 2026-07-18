import { describe, expect, it } from "vitest";
import {
  createLeaderboardRecordPayload,
  LEADERBOARD_COLLECTION_NAME,
  LEADERBOARD_FETCH_LIMIT,
  mapStoredLeaderboardRecord
} from "../src/leaderboard-storage-core.js";

describe("leaderboard-storage-core", () => {
  it("exposes shared Firestore constants", () => {
    expect(LEADERBOARD_COLLECTION_NAME).toBe("leaderboard_v2");
    expect(LEADERBOARD_FETCH_LIMIT).toBe(100);
  });

  it("maps stored leaderboard record into UI shape", () => {
    expect(
      mapStoredLeaderboardRecord({
        player: "Maksim",
        moves: 92,
        timeSeconds: 45,
        createdAtMs: 123
      })
    ).toEqual({
      player: "Maksim",
      moves: 92,
      time: 45,
      createdAtMs: 123
    });
  });

  it("builds Firestore payload with deterministic timestamp", () => {
    expect(
      createLeaderboardRecordPayload(
        {
          player: "Alex",
          moves: 66,
          timeSeconds: 26
        },
        456
      )
    ).toEqual({
      player: "Alex",
      moves: 66,
      timeSeconds: 26,
      createdAtMs: 456
    });
  });
});
