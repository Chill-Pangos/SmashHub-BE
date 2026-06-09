import test from "node:test";
import assert from "node:assert/strict";

import tournamentRefereeController from "../src/controllers/tournamentReferee.controller";
import matchController from "../src/controllers/match.controller";
import subMatchController from "../src/controllers/subMatch.controller";
import subMatchPlayerController from "../src/controllers/subMatchPlayer.controller";
import matchSetController from "../src/controllers/matchSet.controller";

import tournamentRefereeService from "../src/services/tournamentReferee.service";
import matchService from "../src/services/match.service";
import subMatchService from "../src/services/subMatch.service";
import subMatchPlayerService from "../src/services/subMatchPlayer.service";
import matchSetService from "../src/services/matchSet.service";

type ServiceCall = {
  service: string;
  method: string;
  args: unknown[];
};

type MockResponse = {
  statusCode: number;
  body: unknown;
  res: {
    status(code: number): MockResponse["res"];
    json(payload: unknown): MockResponse["res"];
    send(payload?: unknown): MockResponse["res"];
  };
};

function createResponse(): MockResponse {
  const response: MockResponse = {
    statusCode: 200,
    body: undefined,
    res: {
      status(code: number) {
        response.statusCode = code;
        return response.res;
      },
      json(payload: unknown) {
        response.body = payload;
        return response.res;
      },
      send(payload?: unknown) {
        response.body = payload;
        return response.res;
      },
    },
  };

  return response;
}

function makeReq({
  userId,
  params = {},
  query = {},
  body = {},
}: {
  userId?: number;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): any {
  return { userId, params, query, body };
}

async function invoke(
  handler: (req: any, res: any, next: (error?: unknown) => void) => Promise<void>,
  req: any,
): Promise<MockResponse> {
  const response = createResponse();
  let nextError: unknown;

  await handler(req, response.res, (error?: unknown) => {
    nextError = error;
  });

  if (nextError) throw nextError;
  return response;
}

function patchMethods<T extends object>(
  t: test.TestContext,
  target: T,
  methods: Partial<Record<keyof T, (...args: any[]) => unknown>>,
): void {
  const originals = new Map<keyof T, unknown>();

  for (const [method, implementation] of Object.entries(methods) as [
    keyof T,
    (...args: any[]) => unknown,
  ][]) {
    originals.set(method, target[method]);
    (target as any)[method] = implementation;
  }

  t.after(() => {
    for (const [method, original] of originals) {
      (target as any)[method] = original;
    }
  });
}

function record(
  calls: ServiceCall[],
  service: string,
  method: string,
  result: unknown,
): (...args: unknown[]) => Promise<unknown> {
  return async (...args: unknown[]) => {
    calls.push({ service, method, args });
    return result;
  };
}

test("referee and chief_referee can list, accept, and reject invitations", async (t) => {
  const calls: ServiceCall[] = [];

  patchMethods(t, tournamentRefereeService, {
    getMyInvitations: async (refereeId: number, options: unknown) => {
      calls.push({
        service: "tournamentRefereeService",
        method: "getMyInvitations",
        args: [refereeId, options],
      });

      return {
        invitations: [
          { id: refereeId === 21 ? 701 : 702, refereeId, role: "referee", status: "pending" },
        ],
        count: 1,
      };
    },
    acceptInvitation: record(
      calls,
      "tournamentRefereeService",
      "acceptInvitation",
      { id: 701, refereeId: 21, role: "referee", status: "accepted" },
    ),
    rejectInvitation: record(
      calls,
      "tournamentRefereeService",
      "rejectInvitation",
      { id: 702, refereeId: 22, role: "chief_referee", status: "rejected" },
    ),
  });

  const refereeInvitations = await invoke(
    tournamentRefereeController.getMyInvitations.bind(tournamentRefereeController),
    makeReq({ userId: 21, query: { status: "pending", page: "1", limit: "10" } }),
  );
  assert.equal(refereeInvitations.statusCode, 200);

  const accepted = await invoke(
    tournamentRefereeController.acceptInvitation.bind(tournamentRefereeController),
    makeReq({ userId: 21, body: { invitationId: 701 } }),
  );
  assert.equal(accepted.statusCode, 200);
  assert.deepEqual((accepted.body as any).status, "accepted");

  const chiefInvitations = await invoke(
    tournamentRefereeController.getMyInvitations.bind(tournamentRefereeController),
    makeReq({ userId: 22, query: { status: "pending", page: "1", limit: "10" } }),
  );
  assert.equal(chiefInvitations.statusCode, 200);

  const rejected = await invoke(
    tournamentRefereeController.rejectInvitation.bind(tournamentRefereeController),
    makeReq({
      userId: 22,
      body: { invitationId: 702, rejectionReason: "Busy on match day" },
    }),
  );
  assert.equal(rejected.statusCode, 200);
  assert.deepEqual((rejected.body as any).status, "rejected");

  assert.deepEqual(
    calls.map((call) => `${call.service}.${call.method}`),
    [
      "tournamentRefereeService.getMyInvitations",
      "tournamentRefereeService.acceptInvitation",
      "tournamentRefereeService.getMyInvitations",
      "tournamentRefereeService.rejectInvitation",
    ],
  );
  assert.deepEqual(calls[0]?.args, [
    21,
    { status: "pending", offset: 0, limit: 10, sortBy: "createdAt", sortOrder: "DESC" },
  ]);
  assert.deepEqual(calls[1]?.args, [21, 701]);
  assert.deepEqual(calls[3]?.args, [22, 702, "Busy on match day"]);
});

test("singles or doubles flow starts match, scores one sub-match, submits result, and chief approves", async (t) => {
  const calls: ServiceCall[] = [];
  const matchId = 9001;
  const subMatchId = 9101;

  patchMethods(t, subMatchService, {
    getSubMatchesByMatch: record(calls, "subMatchService", "getSubMatchesByMatch", [
      { id: subMatchId, matchId, subMatchNumber: 1, status: "scheduled" },
    ]),
    startSubMatch: record(calls, "subMatchService", "startSubMatch", {
      message: "Sub-match started successfully",
      lineupReady: true,
      subMatch: { id: subMatchId, matchId, status: "in_progress" },
    }),
    finalizeSubMatch: record(calls, "subMatchService", "finalizeSubMatch", {
      message: "Sub-match finalized. Match is ready to finalize.",
      matchReadyToFinalize: true,
      subMatch: { id: subMatchId, matchId, status: "completed", winnerTeam: "A" },
    }),
  });

  patchMethods(t, matchService, {
    bulkStartMatches: record(calls, "matchService", "bulkStartMatches", {
      succeeded: [{ id: matchId, status: "in_progress" }],
      failed: [],
    }),
    findAssignedMatchesForReferee: record(calls, "matchService", "findAssignedMatchesForReferee", {
      matches: [{ id: matchId, status: "in_progress" }],
      count: 1,
    }),
    finalizeMatch: record(calls, "matchService", "finalizeMatch", {
      id: matchId,
      status: "completed",
      resultStatus: "pending",
      winnerEntryId: 1001,
    }),
    findPendingMatches: record(calls, "matchService", "findPendingMatches", {
      matches: [{ id: matchId, status: "completed", resultStatus: "pending" }],
      count: 1,
    }),
    approveMatchResult: record(calls, "matchService", "approveMatchResult", {
      id: matchId,
      status: "completed",
      resultStatus: "approved",
    }),
  });

  let setsReadCount = 0;
  patchMethods(t, matchSetService, {
    getSetsBySubMatch: async (id: number) => {
      calls.push({ service: "matchSetService", method: "getSetsBySubMatch", args: [id] });
      setsReadCount += 1;
      return setsReadCount === 1
        ? []
        : [{ id: 9201, subMatchId, setNumber: 1, entryAScore: 21, entryBScore: 11 }];
    },
    updateLiveSetScore: async (refereeId: number, payload: any) => {
      calls.push({
        service: "matchSetService",
        method: "updateLiveSetScore",
        args: [refereeId, payload],
      });

      if (payload.setNumber === 1) {
        return {
          message: "Set completed and saved. Start next set.",
          isCompleted: true,
          nextSetNumber: 2,
          subMatchReadyToFinalize: false,
          persistedSet: { id: 9201, subMatchId, setNumber: 1 },
        };
      }

      return {
        message: "Set completed and saved. Referee must finalize sub-match.",
        isCompleted: true,
        subMatchReadyToFinalize: true,
        winningTeam: "A",
        finalizationNotice: { subMatchId, matchId, matchWillBeCompleted: true },
        persistedSet: { id: 9202, subMatchId, setNumber: 2 },
      };
    },
  });

  const chiefSeesSubMatches = await invoke(
    subMatchController.getByMatchId.bind(subMatchController),
    makeReq({ userId: 31, params: { matchId: String(matchId) } }),
  );
  assert.equal(chiefSeesSubMatches.statusCode, 200);
  assert.equal((chiefSeesSubMatches.body as any).count, 1);

  const bulkStarted = await invoke(
    matchController.bulkStartMatches.bind(matchController),
    makeReq({ userId: 31, body: { matchIds: [matchId, matchId] } }),
  );
  assert.equal(bulkStarted.statusCode, 200);
  assert.equal((bulkStarted.body as any).totalRequested, 1);
  assert.equal((bulkStarted.body as any).totalSucceeded, 1);

  const refereeMatches = await invoke(
    matchController.findAssignedMatchesForReferee.bind(matchController),
    makeReq({ userId: 41, query: { categoryId: "101", status: "in_progress" } }),
  );
  assert.equal(refereeMatches.statusCode, 200);
  assert.equal((refereeMatches.body as any).matches[0].id, matchId);

  await invoke(
    subMatchController.getByMatchId.bind(subMatchController),
    makeReq({ userId: 41, params: { matchId: String(matchId) } }),
  );

  const startedSubMatch = await invoke(
    subMatchController.start.bind(subMatchController),
    makeReq({ userId: 41, params: { id: String(subMatchId) } }),
  );
  assert.equal(startedSubMatch.statusCode, 200);
  assert.equal((startedSubMatch.body as any).lineupReady, true);

  const firstSets = await invoke(
    matchSetController.getBySubMatchId.bind(matchSetController),
    makeReq({ userId: 41, params: { subMatchId: String(subMatchId) } }),
  );
  assert.equal(firstSets.statusCode, 200);
  assert.equal((firstSets.body as any).count, 0);

  const firstSetScore = await invoke(
    matchSetController.updateLiveSetScore.bind(matchSetController),
    makeReq({
      userId: 41,
      body: { subMatchId, setNumber: 1, entryAScore: 21, entryBScore: 11 },
    }),
  );
  assert.equal(firstSetScore.statusCode, 201);
  assert.equal((firstSetScore.body as any).subMatchReadyToFinalize, false);

  const nextSets = await invoke(
    matchSetController.getBySubMatchId.bind(matchSetController),
    makeReq({ userId: 41, params: { subMatchId: String(subMatchId) } }),
  );
  assert.equal(nextSets.statusCode, 200);
  assert.equal((nextSets.body as any).sets[0].setNumber, 1);

  const secondSetScore = await invoke(
    matchSetController.updateLiveSetScore.bind(matchSetController),
    makeReq({
      userId: 41,
      body: { subMatchId, setNumber: 2, entryAScore: 21, entryBScore: 14 },
    }),
  );
  assert.equal(secondSetScore.statusCode, 201);
  assert.equal((secondSetScore.body as any).subMatchReadyToFinalize, true);

  const finalizedSubMatch = await invoke(
    subMatchController.finalize.bind(subMatchController),
    makeReq({ userId: 41, params: { id: String(subMatchId) } }),
  );
  assert.equal(finalizedSubMatch.statusCode, 200);
  assert.equal((finalizedSubMatch.body as any).matchReadyToFinalize, true);

  const finalizedMatch = await invoke(
    matchController.finalizeMatch.bind(matchController),
    makeReq({ userId: 41, params: { id: String(matchId) } }),
  );
  assert.equal(finalizedMatch.statusCode, 200);
  assert.equal((finalizedMatch.body as any).match.resultStatus, "pending");

  const pendingMatches = await invoke(
    matchController.findPendingMatches.bind(matchController),
    makeReq({ userId: 31, query: { tournamentId: "501" } }),
  );
  assert.equal(pendingMatches.statusCode, 200);
  assert.equal((pendingMatches.body as any).matches[0].resultStatus, "pending");

  const approvedMatch = await invoke(
    matchController.approveMatchResult.bind(matchController),
    makeReq({ userId: 31, params: { id: String(matchId) }, body: { reviewNotes: "OK" } }),
  );
  assert.equal(approvedMatch.statusCode, 200);
  assert.equal((approvedMatch.body as any).match.resultStatus, "approved");

  assert.deepEqual(calls.map((call) => `${call.service}.${call.method}`), [
    "subMatchService.getSubMatchesByMatch",
    "matchService.bulkStartMatches",
    "matchService.findAssignedMatchesForReferee",
    "subMatchService.getSubMatchesByMatch",
    "subMatchService.startSubMatch",
    "matchSetService.getSetsBySubMatch",
    "matchSetService.updateLiveSetScore",
    "matchSetService.getSetsBySubMatch",
    "matchSetService.updateLiveSetScore",
    "subMatchService.finalizeSubMatch",
    "matchService.finalizeMatch",
    "matchService.findPendingMatches",
    "matchService.approveMatchResult",
  ]);
  assert.deepEqual(calls[1]?.args, [31, [matchId]]);
});

test("team flow requires captain lineup review before sub-match start and loops until match is ready", async (t) => {
  const calls: ServiceCall[] = [];
  const matchId = 9301;
  const subMatchOneId = 9401;
  const subMatchTwoId = 9402;
  const captainAId = 51;
  const captainBId = 52;
  const umpireId = 61;

  patchMethods(t, subMatchPlayerService, {
    submitTeamLineups: async (captainId: number, id: number, lineups: unknown) => {
      calls.push({
        service: "subMatchPlayerService",
        method: "submitTeamLineups",
        args: [captainId, id, lineups],
      });
      return [{ matchId: id, captainId, status: "pending", lineups }];
    },
    getPendingLineupsForUmpire: record(
      calls,
      "subMatchPlayerService",
      "getPendingLineupsForUmpire",
      [
        { matchId, subMatchId: subMatchOneId, team: "A", status: "pending" },
        { matchId, subMatchId: subMatchOneId, team: "B", status: "pending" },
      ],
    ),
    rejectPendingLineupsByMatch: record(
      calls,
      "subMatchPlayerService",
      "rejectPendingLineupsByMatch",
      [
        {
          matchId,
          subMatchId: subMatchOneId,
          status: "rejected",
          reviewNotes: "Lineup invalid",
        },
      ],
    ),
    getRejectedLineupsForCaptain: record(
      calls,
      "subMatchPlayerService",
      "getRejectedLineupsForCaptain",
      [{ matchId, subMatchId: subMatchOneId, status: "rejected" }],
    ),
    approvePendingLineupsByMatch: record(
      calls,
      "subMatchPlayerService",
      "approvePendingLineupsByMatch",
      [
        { id: 9501, subMatchId: subMatchOneId, entryMemberId: 10001, team: "A" },
        { id: 9502, subMatchId: subMatchOneId, entryMemberId: 10002, team: "B" },
      ],
    ),
  });

  let finalizeCount = 0;
  patchMethods(t, subMatchService, {
    startSubMatch: async (refereeId: number, subMatchId: number) => {
      calls.push({
        service: "subMatchService",
        method: "startSubMatch",
        args: [refereeId, subMatchId],
      });
      return {
        message: "Sub-match started successfully",
        lineupReady: true,
        subMatch: { id: subMatchId, matchId, status: "in_progress" },
      };
    },
    finalizeSubMatch: async (refereeId: number, subMatchId: number) => {
      calls.push({
        service: "subMatchService",
        method: "finalizeSubMatch",
        args: [refereeId, subMatchId],
      });
      finalizeCount += 1;
      return {
        message:
          finalizeCount === 1
            ? "Sub-match finalized. Continue next sub-match."
            : "Sub-match finalized. Match is ready to finalize.",
        matchReadyToFinalize: finalizeCount === 2,
        subMatch: { id: subMatchId, matchId, status: "completed", winnerTeam: "A" },
      };
    },
  });

  patchMethods(t, matchService, {
    finalizeMatch: record(calls, "matchService", "finalizeMatch", {
      id: matchId,
      status: "completed",
      resultStatus: "pending",
      winnerEntryId: 12001,
    }),
    findPendingMatches: record(calls, "matchService", "findPendingMatches", {
      matches: [{ id: matchId, status: "completed", resultStatus: "pending" }],
      count: 1,
    }),
    rejectMatchResult: record(calls, "matchService", "rejectMatchResult", {
      id: matchId,
      status: "in_progress",
      resultStatus: "rejected",
      winnerEntryId: null,
      reviewNotes: "Score evidence mismatch",
    }),
  });

  const firstSubmitA = await invoke(
    subMatchPlayerController.submitTeamLineup.bind(subMatchPlayerController),
    makeReq({
      userId: captainAId,
      params: { matchId: String(matchId) },
      body: {
        lineups: [
          { subMatchId: subMatchOneId, entryMemberIds: [10001] },
          { subMatchId: subMatchTwoId, entryMemberIds: [10003] },
        ],
      },
    }),
  );
  assert.equal(firstSubmitA.statusCode, 202);

  const submitB = await invoke(
    subMatchPlayerController.submitTeamLineup.bind(subMatchPlayerController),
    makeReq({
      userId: captainBId,
      params: { matchId: String(matchId) },
      body: {
        lineups: [
          { subMatchId: subMatchOneId, entryMemberIds: [10002] },
          { subMatchId: subMatchTwoId, entryMemberIds: [10004] },
        ],
      },
    }),
  );
  assert.equal(submitB.statusCode, 202);

  const pendingLineups = await invoke(
    subMatchPlayerController.getPendingLineupsForUmpire.bind(subMatchPlayerController),
    makeReq({ userId: umpireId }),
  );
  assert.equal(pendingLineups.statusCode, 200);
  assert.equal((pendingLineups.body as any).lineups.length, 2);

  const rejectedLineup = await invoke(
    subMatchPlayerController.rejectTeamLineup.bind(subMatchPlayerController),
    makeReq({
      userId: umpireId,
      params: { matchId: String(matchId) },
      body: { reviewNotes: "Lineup invalid" },
    }),
  );
  assert.equal(rejectedLineup.statusCode, 200);
  assert.equal((rejectedLineup.body as any).rejected[0].status, "rejected");

  const captainSeesReject = await invoke(
    subMatchPlayerController.getRejectedLineupsForCaptain.bind(subMatchPlayerController),
    makeReq({ userId: captainAId }),
  );
  assert.equal(captainSeesReject.statusCode, 200);
  assert.equal((captainSeesReject.body as any).rejected[0].status, "rejected");

  const correctedSubmit = await invoke(
    subMatchPlayerController.submitTeamLineup.bind(subMatchPlayerController),
    makeReq({
      userId: captainAId,
      params: { matchId: String(matchId) },
      body: {
        lineups: [
          { subMatchId: subMatchOneId, entryMemberIds: [10005] },
          { subMatchId: subMatchTwoId, entryMemberIds: [10006] },
        ],
      },
    }),
  );
  assert.equal(correctedSubmit.statusCode, 202);

  const approvedLineup = await invoke(
    subMatchPlayerController.approveTeamLineup.bind(subMatchPlayerController),
    makeReq({ userId: umpireId, params: { matchId: String(matchId) } }),
  );
  assert.equal(approvedLineup.statusCode, 200);
  assert.equal((approvedLineup.body as any).players.length, 2);

  const firstStarted = await invoke(
    subMatchController.start.bind(subMatchController),
    makeReq({ userId: umpireId, params: { id: String(subMatchOneId) } }),
  );
  assert.equal(firstStarted.statusCode, 200);
  assert.equal((firstStarted.body as any).lineupReady, true);

  const firstFinalized = await invoke(
    subMatchController.finalize.bind(subMatchController),
    makeReq({ userId: umpireId, params: { id: String(subMatchOneId) } }),
  );
  assert.equal(firstFinalized.statusCode, 200);
  assert.equal((firstFinalized.body as any).matchReadyToFinalize, false);

  const secondStarted = await invoke(
    subMatchController.start.bind(subMatchController),
    makeReq({ userId: umpireId, params: { id: String(subMatchTwoId) } }),
  );
  assert.equal(secondStarted.statusCode, 200);

  const secondFinalized = await invoke(
    subMatchController.finalize.bind(subMatchController),
    makeReq({ userId: umpireId, params: { id: String(subMatchTwoId) } }),
  );
  assert.equal(secondFinalized.statusCode, 200);
  assert.equal((secondFinalized.body as any).matchReadyToFinalize, true);

  const finalizedMatch = await invoke(
    matchController.finalizeMatch.bind(matchController),
    makeReq({ userId: umpireId, params: { id: String(matchId) } }),
  );
  assert.equal(finalizedMatch.statusCode, 200);
  assert.equal((finalizedMatch.body as any).match.resultStatus, "pending");

  const pendingMatch = await invoke(
    matchController.findPendingMatches.bind(matchController),
    makeReq({ userId: 31, query: { tournamentId: "501" } }),
  );
  assert.equal(pendingMatch.statusCode, 200);
  assert.equal((pendingMatch.body as any).matches[0].id, matchId);

  const rejectedMatch = await invoke(
    matchController.rejectMatchResult.bind(matchController),
    makeReq({
      userId: 31,
      params: { id: String(matchId) },
      body: { reviewNotes: "Score evidence mismatch" },
    }),
  );
  assert.equal(rejectedMatch.statusCode, 200);
  assert.equal((rejectedMatch.body as any).match.resultStatus, "rejected");

  const methodFlow = calls.map((call) => `${call.service}.${call.method}`);
  assert.ok(
    methodFlow.indexOf("subMatchPlayerService.approvePendingLineupsByMatch") <
      methodFlow.indexOf("subMatchService.startSubMatch"),
  );
  assert.deepEqual(methodFlow, [
    "subMatchPlayerService.submitTeamLineups",
    "subMatchPlayerService.submitTeamLineups",
    "subMatchPlayerService.getPendingLineupsForUmpire",
    "subMatchPlayerService.rejectPendingLineupsByMatch",
    "subMatchPlayerService.getRejectedLineupsForCaptain",
    "subMatchPlayerService.submitTeamLineups",
    "subMatchPlayerService.approvePendingLineupsByMatch",
    "subMatchService.startSubMatch",
    "subMatchService.finalizeSubMatch",
    "subMatchService.startSubMatch",
    "subMatchService.finalizeSubMatch",
    "matchService.finalizeMatch",
    "matchService.findPendingMatches",
    "matchService.rejectMatchResult",
  ]);
});
