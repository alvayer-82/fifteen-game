import { describe, expect, it, vi } from "vitest";
import {
  fetchLeaderboardRecords,
  saveLeaderboardRecord
} from "../src/leaderboard-service.js";
import {
  LEADERBOARD_COLLECTION_NAME,
  LEADERBOARD_FETCH_LIMIT
} from "../src/leaderboard-storage-core.js";

function createFirebaseApi(overrides = {}) {
  return {
    collection: vi.fn((firestore, collectionName) => ({ firestore, collectionName })),
    orderBy: vi.fn((field, direction) => ({ field, direction })),
    limit: vi.fn((value) => ({ value })),
    query: vi.fn((collectionRef, orderByRef, limitRef) => ({ collectionRef, orderByRef, limitRef })),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    ...overrides
  };
}

describe("leaderboard-service", () => {
  it("loads leaderboard records through the Firebase storage layer", async () => {
    const firebaseApi = createFirebaseApi({
      getDocs: vi.fn(async () => ({
        docs: [
          { data: () => ({ player: "Alex", moves: 66, timeSeconds: 26, createdAtMs: 200 }) },
          { data: () => ({ player: "Maksim", moves: 92, timeSeconds: 45, createdAtMs: 100 }) }
        ]
      }))
    });

    const result = await fetchLeaderboardRecords({
      firestore: { app: "firestore" },
      firebaseApi
    });

    expect(firebaseApi.collection).toHaveBeenCalledWith({ app: "firestore" }, LEADERBOARD_COLLECTION_NAME);
    expect(firebaseApi.orderBy).toHaveBeenCalledWith("createdAtMs", "desc");
    expect(firebaseApi.limit).toHaveBeenCalledWith(LEADERBOARD_FETCH_LIMIT);
    expect(result).toEqual({
      success: true,
      records: [
        { player: "Alex", moves: 66, time: 26, createdAtMs: 200 },
        { player: "Maksim", moves: 92, time: 45, createdAtMs: 100 }
      ]
    });
  });

  it("saves leaderboard result through the Firebase storage layer", async () => {
    const firebaseApi = createFirebaseApi({
      addDoc: vi.fn(async () => undefined)
    });

    const result = await saveLeaderboardRecord({
      firestore: { app: "firestore" },
      player: "Winner",
      moves: 48,
      timeSeconds: 33,
      firebaseApi,
      now: () => 123456
    });

    expect(firebaseApi.collection).toHaveBeenCalledWith({ app: "firestore" }, LEADERBOARD_COLLECTION_NAME);
    expect(firebaseApi.serverTimestamp).toHaveBeenCalled();
    expect(firebaseApi.addDoc).toHaveBeenCalledWith(
      { firestore: { app: "firestore" }, collectionName: LEADERBOARD_COLLECTION_NAME },
      {
        player: "Winner",
        moves: 48,
        timeSeconds: 33,
        createdAtMs: 123456,
        createdAt: "SERVER_TIMESTAMP"
      }
    );
    expect(result).toEqual({ success: true });
  });

  it("returns controlled error when leaderboard loading fails", async () => {
    const firebaseApi = createFirebaseApi({
      getDocs: vi.fn(async () => {
        throw new Error("Firestore read failed");
      })
    });

    const result = await fetchLeaderboardRecords({
      firestore: { app: "firestore" },
      firebaseApi
    });

    expect(result).toEqual({
      success: false,
      code: "load-failed",
      records: []
    });
  });

  it("returns controlled error when leaderboard saving fails", async () => {
    const firebaseApi = createFirebaseApi({
      addDoc: vi.fn(async () => {
        throw new Error("Firestore write failed");
      })
    });

    const result = await saveLeaderboardRecord({
      firestore: { app: "firestore" },
      player: "Winner",
      moves: 48,
      timeSeconds: 33,
      firebaseApi
    });

    expect(result).toEqual({
      success: false,
      code: "save-failed"
    });
  });
});
