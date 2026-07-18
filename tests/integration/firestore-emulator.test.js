import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  getPagedLeaderboardRecords,
  getSortedLeaderboardRecords
} from "../../src/leaderboard-core.js";
import {
  createLeaderboardRecordPayload,
  LEADERBOARD_COLLECTION_NAME,
  LEADERBOARD_FETCH_LIMIT,
  mapStoredLeaderboardRecord
} from "../../src/leaderboard-storage-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firestoreRules = fs.readFileSync(path.resolve(__dirname, "../../firestore.rules"), "utf8");
const denyReadRules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /${LEADERBOARD_COLLECTION_NAME}/{documentId} {
      allow read, write: if false;
    }
  }
}
`;

let testEnv;
let denyReadEnv;

function getGuestDb(environment = testEnv) {
  return environment.unauthenticatedContext().firestore();
}

async function seedLeaderboardRecords(records, environment = testEnv) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = db.batch();

    records.forEach((record, index) => {
      batch.set(
        db.collection(LEADERBOARD_COLLECTION_NAME).doc(String(index + 1)),
        record
      );
    });

    await batch.commit();
  });
}

async function fetchLeaderboardRecords(db) {
  const snapshot = await db
    .collection(LEADERBOARD_COLLECTION_NAME)
    .orderBy("createdAtMs", "desc")
    .limit(LEADERBOARD_FETCH_LIMIT)
    .get();

  return snapshot.docs.map((documentSnapshot) => mapStoredLeaderboardRecord(documentSnapshot.data()));
}

async function saveLeaderboardRecord(db, payload, nowMs = Date.now()) {
  return db.collection(LEADERBOARD_COLLECTION_NAME).add({
    ...createLeaderboardRecordPayload(payload, nowMs),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function seedSingleLeaderboardRecord(record, documentId = "seed-1", environment = testEnv) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection(LEADERBOARD_COLLECTION_NAME).doc(documentId).set(record);
  });

  return documentId;
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-fifteen-game",
    firestore: {
      rules: firestoreRules
    }
  });

  denyReadEnv = await initializeTestEnvironment({
    projectId: "demo-fifteen-game-deny-read",
    firestore: {
      rules: denyReadRules
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await denyReadEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
  await denyReadEnv.cleanup();
});

describe("Firestore emulator integration", () => {
  it("reads leaderboard records from Firestore", async () => {
    await seedLeaderboardRecords([
      { player: "Супермен", moves: 66, timeSeconds: 26, createdAtMs: 200 },
      { player: "Maksim", moves: 92, timeSeconds: 45, createdAtMs: 100 }
    ]);

    const records = await assertSucceeds(fetchLeaderboardRecords(getGuestDb()));

    expect(records).toEqual([
      { player: "Супермен", moves: 66, time: 26, createdAtMs: 200 },
      { player: "Maksim", moves: 92, time: 45, createdAtMs: 100 }
    ]);
  });

  it("writes saved result with correct fields", async () => {
    const db = getGuestDb();

    await assertSucceeds(
      saveLeaderboardRecord(
        db,
        {
          player: "Alex",
          moves: 66,
          timeSeconds: 26
        },
        123456
      )
    );

    let storedRecords = [];
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snapshot = await context.firestore().collection(LEADERBOARD_COLLECTION_NAME).get();
      storedRecords = snapshot.docs.map((documentSnapshot) => documentSnapshot.data());
    });

    expect(storedRecords).toHaveLength(1);
    expect(storedRecords[0]).toMatchObject({
      player: "Alex",
      moves: 66,
      timeSeconds: 26,
      createdAtMs: 123456
    });
    expect(storedRecords[0].createdAt).toBeTruthy();
  });

  it("maps Firestore document data into the UI leaderboard model", async () => {
    await seedLeaderboardRecords([
      { player: "Ольга", moves: 74, timeSeconds: 47, createdAtMs: 321 }
    ]);

    const [record] = await assertSucceeds(fetchLeaderboardRecords(getGuestDb()));

    expect(record).toEqual({
      player: "Ольга",
      moves: 74,
      time: 47,
      createdAtMs: 321
    });
  });

  it("denies reading leaderboard data when rules forbid reads", async () => {
    await seedLeaderboardRecords([
      { player: "Secret", moves: 80, timeSeconds: 33, createdAtMs: 10 }
    ], denyReadEnv);

    await assertFails(
      denyReadEnv
        .unauthenticatedContext()
        .firestore()
        .collection(LEADERBOARD_COLLECTION_NAME)
        .get()
    );
  });

  it("denies invalid leaderboard writes", async () => {
    const db = getGuestDb();

    await assertFails(
      db.collection(LEADERBOARD_COLLECTION_NAME).add({
        player: "",
        moves: -1,
        timeSeconds: -5,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAtMs: 1
      })
    );
  });

  it("denies updating an existing leaderboard record", async () => {
    const documentId = await seedSingleLeaderboardRecord({
      player: "Alex",
      moves: 66,
      timeSeconds: 26,
      createdAtMs: 123456
    });

    await assertFails(
      getGuestDb()
        .collection(LEADERBOARD_COLLECTION_NAME)
        .doc(documentId)
        .update({
          moves: 67
        })
    );
  });

  it("denies deleting an existing leaderboard record", async () => {
    const documentId = await seedSingleLeaderboardRecord({
      player: "Alex",
      moves: 66,
      timeSeconds: 26,
      createdAtMs: 123456
    });

    await assertFails(
      getGuestDb()
        .collection(LEADERBOARD_COLLECTION_NAME)
        .doc(documentId)
        .delete()
    );
  });

  it("returns records in a shape that supports sorting and pagination", async () => {
    const recordsToSeed = Array.from({ length: 12 }, (_, index) => ({
      player: `Player ${String.fromCharCode(65 + index)}`,
      moves: 70 + index,
      timeSeconds: 40 - (index % 5),
      createdAtMs: 1000 + index
    }));

    await seedLeaderboardRecords(recordsToSeed);

    const loadedRecords = await assertSucceeds(fetchLeaderboardRecords(getGuestDb()));
    const sortedRecords = getSortedLeaderboardRecords(loadedRecords, { key: "moves", direction: "asc" });
    const page = getPagedLeaderboardRecords(sortedRecords, 1, 10);

    expect(loadedRecords).toHaveLength(12);
    expect(page.records).toHaveLength(10);
    expect(page.totalPages).toBe(2);
    expect(page.records[0]).toMatchObject({ player: "Player A", moves: 70 });
    expect(page.records.at(-1)).toMatchObject({ player: "Player J", moves: 79 });
  });

  it("returns an empty leaderboard when the database has no records", async () => {
    const records = await assertSucceeds(fetchLeaderboardRecords(getGuestDb()));

    expect(records).toEqual([]);
  });
});
