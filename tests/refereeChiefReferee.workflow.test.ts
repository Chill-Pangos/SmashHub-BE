import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import app from "../src/app";
import tournamentRefereeController from "../src/controllers/tournamentReferee.controller";
import eloHistoryController from "../src/controllers/eloHistory.controller";
import entryController from "../src/controllers/entry.controller";
import groupStandingController from "../src/controllers/groupStanding.controller";
import knockoutBracketController from "../src/controllers/knockoutBracket.controller";
import matchController from "../src/controllers/match.controller";
import scheduleController from "../src/controllers/schedule.controller";
import subMatchController from "../src/controllers/subMatch.controller";
import subMatchPlayerController from "../src/controllers/subMatchPlayer.controller";
import matchSetController from "../src/controllers/matchSet.controller";

import tournamentRefereeService from "../src/services/tournamentReferee.service";
import eloHistoryService from "../src/services/eloHistory.service";
import entryService from "../src/services/entry.service";
import groupStandingService from "../src/services/groupStanding.service";
import knockoutBracketService from "../src/services/knockoutBracket.service";
import matchService from "../src/services/match.service";
import scheduleService from "../src/services/schedule.service";
import subMatchService from "../src/services/subMatch.service";
import subMatchPlayerService from "../src/services/subMatchPlayer.service";
import matchSetService from "../src/services/matchSet.service";
import authService from "../src/services/auth.service";
import User from "../src/models/user.model";

const repoRoot = path.join(__dirname, "..");
const seedSqlPath = path.join(repoRoot, "database/migrations/002-seed-default-data.sql");
const routeDir = path.join(repoRoot, "src/routes");
const organizerUserId = 2;
const refereeUserId = 203;
const chiefRefereeUserId = 353;

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

type HttpResponse = {
  status: number;
  body: any;
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

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

function readSeedSql(): string {
  return fs.readFileSync(seedSqlPath, "utf8");
}

function readRouteSources(): string {
  return fs
    .readdirSync(routeDir)
    .filter((file) => file.endsWith(".routes.ts"))
    .map((file) => fs.readFileSync(path.join(routeDir, file), "utf8"))
    .join("\n");
}

function extractSeededPermissions(seedSql: string): Set<string> {
  const permissions = new Set<string>();

  for (const match of seedSql.matchAll(/\('([^']+:[^']+)'\)/g)) {
    permissions.add(match[1] as string);
  }

  return permissions;
}

function extractSeededRolePermissions(seedSql: string, roleName: string): Set<string> {
  if (roleName === "admin") {
    return extractSeededPermissions(seedSql);
  }

  const headings: Record<string, string> = {
    user: "User",
    referee: "Referee",
    chief_referee: "Chief referee",
    organizer: "Organizer",
  };
  const heading = headings[roleName];
  assert.ok(heading, `Unknown role: ${roleName}`);

  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = seedSql.match(new RegExp(`-- ${escapedHeading} permissions[\\s\\S]*?WHERE \`name\` IN \\(([\\s\\S]*?)\\);`));
  assert.ok(block?.[1], `Missing role permission block: ${roleName}`);

  return new Set([...block[1].matchAll(/'([^']+:[^']+)'/g)].map((match) => match[1] as string));
}

function extractRoutePermissions(routeSources: string): Set<string> {
  const permissions = new Set<string>();

  for (const match of routeSources.matchAll(/checkPermission\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    permissions.add(match[1] as string);
  }

  for (const match of routeSources.matchAll(/checkAnyPermission\(\s*\[([\s\S]*?)\]\s*\)/g)) {
    const permissionList = match[1] as string;
    for (const permission of permissionList.matchAll(/['"]([^'"]+)['"]/g)) {
      permissions.add(permission[1] as string);
    }
  }

  return permissions;
}

function hasRoutePermission(routeSources: string, permission: string): boolean {
  return routeSources.includes(`checkPermission("${permission}")`)
    || routeSources.includes(`checkPermission('${permission}')`);
}

async function requestApp(
  method: string,
  routePath: string,
  token?: string,
  body?: unknown,
): Promise<HttpResponse> {
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${routePath}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body == null ? {} : { "content-type": "application/json" }),
      },
      body: body == null ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const parsedBody = text ? JSON.parse(text) : undefined;

    return {
      status: response.status,
      body: parsedBody,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("seed users match deterministic role ranges", () => {
  const seedSql = readSeedSql();

  assert.equal(countMatches(seedSql, /'admin@test\.com'/g), 1);
  assert.equal(countMatches(seedSql, /'organizer@test\.com'/g), 1);
  assert.equal(countMatches(seedSql, /'user\d+@test\.com'/g), 200);
  assert.equal(countMatches(seedSql, /'referee\d+@test\.com'/g), 150);
  assert.equal(countMatches(seedSql, /'chief_referee\d+@test\.com'/g), 50);
  assert.equal(countMatches(seedSql, /'user_\d+@test\.com'/g), 0);
  assert.equal(countMatches(seedSql, /'referee_\d+@test\.com'/g), 0);
  assert.equal(countMatches(seedSql, /'chief_referee_\d+@test\.com'/g), 0);

  assert.match(seedSql, /\(3, 'User', '1', 'user1@test\.com'/);
  assert.match(seedSql, /\(202, 'User', '200', 'user200@test\.com'/);
  assert.match(seedSql, /\(203, 'Referee', '1', 'referee1@test\.com'/);
  assert.match(seedSql, /\(352, 'Referee', '150', 'referee150@test\.com'/);
  assert.match(seedSql, /\(353, 'Chief Referee', '1', 'chief_referee1@test\.com'/);
  assert.match(seedSql, /\(402, 'Chief Referee', '50', 'chief_referee50@test\.com'/);

  assert.equal(countMatches(seedSql, /^\(1, 1,/gm), 1);
  assert.equal(countMatches(seedSql, /^\(2, 5,/gm), 1);
  assert.equal(countMatches(seedSql, /^\((?:[3-9]|[1-9]\d|1\d\d|20[0-2]), 2,/gm), 200);
  assert.equal(countMatches(seedSql, /^\((?:20[3-9]|2[1-9]\d|3[0-4]\d|35[0-2]), 4,/gm), 150);
  assert.equal(countMatches(seedSql, /^\((?:35[3-9]|3[6-9]\d|40[0-2]), 3,/gm), 50);
});

test("route permissions are seeded and domain-specific permissions stay wired", () => {
  const seedPermissions = extractSeededPermissions(readSeedSql());
  const routeSources = readRouteSources();
  const routePermissions = extractRoutePermissions(routeSources);
  const missingPermissions = [...routePermissions].filter((permission) => !seedPermissions.has(permission));

  assert.deepEqual(missingPermissions, []);
  assert.equal(routeSources.includes("checkRole("), false);

  for (const permission of [
    "groups:create",
    "groups:update",
    "knockouts:create",
    "knockouts:update",
    "knockouts:view",
    "submatches:create",
    "submatches:start",
    "submatches:update",
    "submatches:view",
    "matchsets:create",
    "matchsets:update",
    "matchsets:view",
    "matchsets:delete",
    "entries:approve",
    "notifications:manage",
  ]) {
    assert.equal(hasRoutePermission(routeSources, permission), true, permission);
  }
});

test("protected routes enforce seeded role permissions through Express middleware", async (t) => {
  const seedSql = readSeedSql();
  const rolesByUserId = new Map<number, string>([
    [1, "admin"],
    [3, "user"],
    [organizerUserId, "organizer"],
    [refereeUserId, "referee"],
    [chiefRefereeUserId, "chief_referee"],
  ]);
  const userIdsByToken = new Map<string, number>([
    ["admin-token", 1],
    ["user-token", 3],
    ["organizer-token", organizerUserId],
    ["referee-token", refereeUserId],
    ["chief-referee-token", chiefRefereeUserId],
  ]);
  const permissionSetsByRole = new Map(
    [...new Set(rolesByUserId.values())].map((roleName) => [
      roleName,
      extractSeededRolePermissions(seedSql, roleName),
    ]),
  );

  patchMethods(t, authService, {
    isTokenBlacklisted: async () => false,
    verifyToken: async (token: string) => {
      const userId = userIdsByToken.get(token);
      if (userId == null) {
        throw new Error("Invalid token");
      }
      return { userId };
    },
    getUserByToken: async (token: string) => {
      const userId = userIdsByToken.get(token);
      return userId == null ? null : ({ id: userId } as any);
    },
  });

  patchMethods(t, User, {
    findByPk: async (userId: number) => {
      const roleName = rolesByUserId.get(userId);
      if (!roleName) return null;

      return {
        get: () => ({
          id: userId,
          roles: [
            {
              name: roleName,
              permissions: [...(permissionSetsByRole.get(roleName) ?? [])].map((name) => ({ name })),
            },
          ],
        }),
      } as any;
    },
  } as any);

  patchMethods(t, groupStandingService, {
    generateGroupPreview: record(
      [],
      "groupStandingService",
      "generateGroupPreview",
      [{ groupName: "A", entries: [] }],
    ),
  });
  patchMethods(t, subMatchService, {
    startSubMatch: record([], "subMatchService", "startSubMatch", {
      message: "Sub-match started successfully",
      lineupReady: true,
      subMatch: { id: 1, status: "in_progress" },
    }),
  });

  const organizerGroup = await requestApp(
    "POST",
    "/api/group-standings/generate",
    "organizer-token",
    { categoryId: 1 },
  );
  assert.equal(organizerGroup.status, 200);
  assert.equal(organizerGroup.body.success, true);

  const refereeGroup = await requestApp(
    "POST",
    "/api/group-standings/generate",
    "referee-token",
    { categoryId: 1 },
  );
  assert.equal(refereeGroup.status, 403);
  assert.match(refereeGroup.body.message, /groups:create/);

  const refereeStart = await requestApp("POST", "/api/sub-matches/1/start", "referee-token");
  assert.equal(refereeStart.status, 200);
  assert.equal(refereeStart.body.lineupReady, true);

  const userStart = await requestApp("POST", "/api/sub-matches/1/start", "user-token");
  assert.equal(userStart.status, 403);
  assert.match(userStart.body.message, /submatches:start/);

  const adminNotifications = await requestApp(
    "GET",
    "/api/notifications/connected-users",
    "admin-token",
  );
  assert.equal(adminNotifications.status, 200);
  assert.equal(adminNotifications.body.totalConnectedUsers, 0);

  const organizerNotifications = await requestApp(
    "GET",
    "/api/notifications/connected-users",
    "organizer-token",
  );
  assert.equal(organizerNotifications.status, 403);
  assert.match(organizerNotifications.body.message, /notifications:manage/);

  const missingToken = await requestApp("POST", "/api/sub-matches/1/start");
  assert.equal(missingToken.status, 401);
});

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
          { id: refereeId === refereeUserId ? 701 : 702, refereeId, role: "referee", status: "pending" },
        ],
        count: 1,
      };
    },
    acceptInvitation: record(
      calls,
      "tournamentRefereeService",
      "acceptInvitation",
      { id: 701, refereeId: refereeUserId, role: "referee", status: "accepted" },
    ),
    rejectInvitation: record(
      calls,
      "tournamentRefereeService",
      "rejectInvitation",
      { id: 702, refereeId: chiefRefereeUserId, role: "chief_referee", status: "rejected" },
    ),
  });

  const refereeInvitations = await invoke(
    tournamentRefereeController.getMyInvitations.bind(tournamentRefereeController),
    makeReq({ userId: refereeUserId, query: { status: "pending", page: "1", limit: "10" } }),
  );
  assert.equal(refereeInvitations.statusCode, 200);

  const accepted = await invoke(
    tournamentRefereeController.acceptInvitation.bind(tournamentRefereeController),
    makeReq({ userId: refereeUserId, body: { invitationId: 701 } }),
  );
  assert.equal(accepted.statusCode, 200);
  assert.deepEqual((accepted.body as any).status, "accepted");

  const chiefInvitations = await invoke(
    tournamentRefereeController.getMyInvitations.bind(tournamentRefereeController),
    makeReq({ userId: chiefRefereeUserId, query: { status: "pending", page: "1", limit: "10" } }),
  );
  assert.equal(chiefInvitations.statusCode, 200);

  const rejected = await invoke(
    tournamentRefereeController.rejectInvitation.bind(tournamentRefereeController),
    makeReq({
      userId: chiefRefereeUserId,
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
    refereeUserId,
    { status: "pending", offset: 0, limit: 10, sortBy: "createdAt", sortOrder: "DESC" },
  ]);
  assert.deepEqual(calls[1]?.args, [refereeUserId, 701]);
  assert.deepEqual(calls[3]?.args, [chiefRefereeUserId, 702, "Busy on match day"]);
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
    makeReq({ userId: chiefRefereeUserId, params: { matchId: String(matchId) } }),
  );
  assert.equal(chiefSeesSubMatches.statusCode, 200);
  assert.equal((chiefSeesSubMatches.body as any).count, 1);

  const bulkStarted = await invoke(
    matchController.bulkStartMatches.bind(matchController),
    makeReq({ userId: chiefRefereeUserId, body: { matchIds: [matchId, matchId] } }),
  );
  assert.equal(bulkStarted.statusCode, 200);
  assert.equal((bulkStarted.body as any).totalRequested, 1);
  assert.equal((bulkStarted.body as any).totalSucceeded, 1);

  const refereeMatches = await invoke(
    matchController.findAssignedMatchesForReferee.bind(matchController),
    makeReq({ userId: refereeUserId, query: { categoryId: "101", status: "in_progress" } }),
  );
  assert.equal(refereeMatches.statusCode, 200);
  assert.equal((refereeMatches.body as any).matches[0].id, matchId);

  await invoke(
    subMatchController.getByMatchId.bind(subMatchController),
    makeReq({ userId: refereeUserId, params: { matchId: String(matchId) } }),
  );

  const startedSubMatch = await invoke(
    subMatchController.start.bind(subMatchController),
    makeReq({ userId: refereeUserId, params: { id: String(subMatchId) } }),
  );
  assert.equal(startedSubMatch.statusCode, 200);
  assert.equal((startedSubMatch.body as any).lineupReady, true);

  const firstSets = await invoke(
    matchSetController.getBySubMatchId.bind(matchSetController),
    makeReq({ userId: refereeUserId, params: { subMatchId: String(subMatchId) } }),
  );
  assert.equal(firstSets.statusCode, 200);
  assert.equal((firstSets.body as any).count, 0);

  const firstSetScore = await invoke(
    matchSetController.updateLiveSetScore.bind(matchSetController),
    makeReq({
      userId: refereeUserId,
      body: { subMatchId, setNumber: 1, entryAScore: 21, entryBScore: 11 },
    }),
  );
  assert.equal(firstSetScore.statusCode, 201);
  assert.equal((firstSetScore.body as any).subMatchReadyToFinalize, false);

  const nextSets = await invoke(
    matchSetController.getBySubMatchId.bind(matchSetController),
    makeReq({ userId: refereeUserId, params: { subMatchId: String(subMatchId) } }),
  );
  assert.equal(nextSets.statusCode, 200);
  assert.equal((nextSets.body as any).sets[0].setNumber, 1);

  const secondSetScore = await invoke(
    matchSetController.updateLiveSetScore.bind(matchSetController),
    makeReq({
      userId: refereeUserId,
      body: { subMatchId, setNumber: 2, entryAScore: 21, entryBScore: 14 },
    }),
  );
  assert.equal(secondSetScore.statusCode, 201);
  assert.equal((secondSetScore.body as any).subMatchReadyToFinalize, true);

  const finalizedSubMatch = await invoke(
    subMatchController.finalize.bind(subMatchController),
    makeReq({ userId: refereeUserId, params: { id: String(subMatchId) } }),
  );
  assert.equal(finalizedSubMatch.statusCode, 200);
  assert.equal((finalizedSubMatch.body as any).matchReadyToFinalize, true);

  const finalizedMatch = await invoke(
    matchController.finalizeMatch.bind(matchController),
    makeReq({ userId: refereeUserId, params: { id: String(matchId) } }),
  );
  assert.equal(finalizedMatch.statusCode, 200);
  assert.equal((finalizedMatch.body as any).match.resultStatus, "pending");

  const pendingMatches = await invoke(
    matchController.findPendingMatches.bind(matchController),
    makeReq({ userId: chiefRefereeUserId, query: { tournamentId: "501" } }),
  );
  assert.equal(pendingMatches.statusCode, 200);
  assert.equal((pendingMatches.body as any).matches[0].resultStatus, "pending");

  const approvedMatch = await invoke(
    matchController.approveMatchResult.bind(matchController),
    makeReq({ userId: chiefRefereeUserId, params: { id: String(matchId) }, body: { reviewNotes: "OK" } }),
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
  assert.deepEqual(calls[1]?.args, [chiefRefereeUserId, [matchId]]);
});

test("team flow requires captain lineup review before sub-match start and loops until match is ready", async (t) => {
  const calls: ServiceCall[] = [];
  const matchId = 9301;
  const subMatchOneId = 9401;
  const subMatchTwoId = 9402;
  const captainAId = 51;
  const captainBId = 52;
  const umpireId = refereeUserId;

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
    makeReq({ userId: chiefRefereeUserId, query: { tournamentId: "501" } }),
  );
  assert.equal(pendingMatch.statusCode, 200);
  assert.equal((pendingMatch.body as any).matches[0].id, matchId);

  const rejectedMatch = await invoke(
    matchController.rejectMatchResult.bind(matchController),
    makeReq({
      userId: chiefRefereeUserId,
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

test("public player can review Elo, matches, register, and manage captain entry actions", async (t) => {
  const calls: ServiceCall[] = [];
  const userId = 71;
  const singleCategoryId = 301;
  const teamCategoryId = 302;
  const captainEntryId = 8101;
  const targetEntryId = 8102;
  const matchId = 9901;
  const joinRequestId = 8801;

  patchMethods(t, eloHistoryService, {
    getByUser: record(calls, "eloHistoryService", "getByUser", {
      rows: [
        {
          id: 1,
          userId,
          previousElo: 1000,
          newElo: 1018,
          eloDelta: 18,
          createdAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      count: 1,
    }),
  });

  patchMethods(t, matchService, {
    findMatchHistoryByAthlete: record(calls, "matchService", "findMatchHistoryByAthlete", {
      matches: [
        {
          id: matchId,
          status: "completed",
          resultStatus: "approved",
          winnerEntryId: captainEntryId,
        },
      ],
      count: 1,
    }),
    findUpcomingMatchesByAthlete: record(calls, "matchService", "findUpcomingMatchesByAthlete", {
      matches: [
        {
          id: 9902,
          status: "scheduled",
          schedule: { scheduledAt: "2026-06-12T09:00:00.000Z" },
        },
        {
          id: 9903,
          status: "in_progress",
          schedule: { scheduledAt: "2026-06-09T14:00:00.000Z" },
        },
      ],
      count: 2,
    }),
  });

  patchMethods(t, entryService, {
    register: async (
      playerId: number,
      categoryId: number,
      action: string,
      targetId?: number,
      name?: string,
    ) => {
      calls.push({
        service: "entryService",
        method: "register",
        args: [playerId, categoryId, action, targetId, name],
      });

      if (categoryId === singleCategoryId) {
        return {
          message: "Single entry created automatically",
          entry: { id: 8001, categoryId, captainId: playerId, name: name ?? "Player 71" },
        };
      }

      if (action === "create_team") {
        return {
          message: "Team created successfully",
          entry: { id: captainEntryId, categoryId, captainId: playerId, name },
        };
      }

      return {
        message: "Join request submitted",
        joinRequest: { id: joinRequestId, entryId: targetId, userId: playerId, status: "pending" },
      };
    },
    getUserRoleInEntry: record(calls, "entryService", "getUserRoleInEntry", "captain"),
    getJoinRequests: record(calls, "entryService", "getJoinRequests", {
      joinRequests: [{ id: joinRequestId, entryId: captainEntryId, userId: 72, status: "pending" }],
      pagination: { total: 1, page: 1, limit: 10 },
    }),
    respondToJoinRequest: async (
      captainId: number,
      requestId: number,
      action: string,
      rejectionReason?: string,
    ) => {
      calls.push({
        service: "entryService",
        method: "respondToJoinRequest",
        args: [captainId, requestId, action, rejectionReason],
      });
      return {
        id: requestId,
        entryId: captainEntryId,
        status: action === "approve" ? "approved" : "rejected",
        rejectionReason,
      };
    },
    transferCaptaincy: record(calls, "entryService", "transferCaptaincy", {
      id: captainEntryId,
      captainId: 72,
    }),
    setRequiredMemberCount: record(calls, "entryService", "setRequiredMemberCount", {
      id: captainEntryId,
      requiredMemberCount: 5,
      currentMemberCount: 4,
    }),
    update: record(calls, "entryService", "update", {
      id: captainEntryId,
      name: "Smash Warriors Elite",
      requiredMemberCount: 5,
      isAcceptingMembers: false,
    }),
    confirmLineup: record(calls, "entryService", "confirmLineup", {
      id: captainEntryId,
      isConfirmed: true,
    }),
    delete: record(calls, "entryService", "delete", undefined),
  });

  const eloChart = await invoke(
    eloHistoryController.findByUserId.bind(eloHistoryController),
    makeReq({ params: { userId: String(userId) }, query: { page: "1", limit: "20" } }),
  );
  assert.equal(eloChart.statusCode, 200);
  assert.equal((eloChart.body as any).rows[0].eloDelta, 18);

  const matchHistory = await invoke(
    matchController.getMatchHistoryByAthlete.bind(matchController),
    makeReq({ params: { userId: String(userId) }, query: { page: "1", limit: "10" } }),
  );
  assert.equal(matchHistory.statusCode, 200);
  assert.equal((matchHistory.body as any).matches[0].id, matchId);

  const upcomingMatches = await invoke(
    matchController.getUpcomingMatchesByAthlete.bind(matchController),
    makeReq({ params: { userId: String(userId) }, query: { page: "1", limit: "10" } }),
  );
  assert.equal(upcomingMatches.statusCode, 200);
  assert.equal((upcomingMatches.body as any).matches[1].status, "in_progress");

  const singleRegistration = await invoke(
    entryController.register.bind(entryController),
    makeReq({
      userId,
      body: { categoryId: singleCategoryId, action: "create_team", name: "Solo Smash" },
    }),
  );
  assert.equal(singleRegistration.statusCode, 201);
  assert.equal((singleRegistration.body as any).entry.id, 8001);

  const createdTeam = await invoke(
    entryController.register.bind(entryController),
    makeReq({
      userId,
      body: { categoryId: teamCategoryId, action: "create_team", name: "Smash Warriors" },
    }),
  );
  assert.equal(createdTeam.statusCode, 201);
  assert.equal((createdTeam.body as any).entry.id, captainEntryId);

  const joinTeam = await invoke(
    entryController.register.bind(entryController),
    makeReq({
      userId,
      body: { categoryId: teamCategoryId, action: "join_team", targetEntryId },
    }),
  );
  assert.equal(joinTeam.statusCode, 201);
  assert.equal((joinTeam.body as any).joinRequest.status, "pending");

  const myRole = await invoke(
    entryController.getUserRoleInEntry.bind(entryController),
    makeReq({ userId, params: { entryId: String(captainEntryId) } }),
  );
  assert.equal(myRole.statusCode, 200);
  assert.equal((myRole.body as any).role, "captain");

  const joinRequests = await invoke(
    entryController.getJoinRequests.bind(entryController),
    makeReq({
      userId,
      params: { entryId: String(captainEntryId) },
      query: { status: "pending", page: "1", limit: "10" },
    }),
  );
  assert.equal(joinRequests.statusCode, 200);
  assert.equal((joinRequests.body as any).joinRequests[0].id, joinRequestId);

  const approvedRequest = await invoke(
    entryController.respondToJoinRequest.bind(entryController),
    makeReq({
      userId,
      params: { joinRequestId: String(joinRequestId) },
      body: { action: "approve" },
    }),
  );
  assert.equal(approvedRequest.statusCode, 200);
  assert.equal((approvedRequest.body as any).status, "approved");

  const rejectedRequest = await invoke(
    entryController.respondToJoinRequest.bind(entryController),
    makeReq({
      userId,
      params: { joinRequestId: String(joinRequestId + 1) },
      body: { action: "reject", rejectionReason: "Player is too strong for this category" },
    }),
  );
  assert.equal(rejectedRequest.statusCode, 200);
  assert.equal((rejectedRequest.body as any).status, "rejected");

  const transferred = await invoke(
    entryController.transferCaptaincy.bind(entryController),
    makeReq({ userId, params: { entryId: String(captainEntryId) }, body: { newCaptainId: 72 } }),
  );
  assert.equal(transferred.statusCode, 200);
  assert.equal((transferred.body as any).captainId, 72);

  const requiredMembers = await invoke(
    entryController.setRequiredMemberCount.bind(entryController),
    makeReq({ userId, params: { entryId: String(captainEntryId) }, body: { count: 5 } }),
  );
  assert.equal(requiredMembers.statusCode, 200);
  assert.equal((requiredMembers.body as any).requiredMemberCount, 5);

  const updatedEntry = await invoke(
    entryController.update.bind(entryController),
    makeReq({
      userId,
      params: { entryId: String(captainEntryId) },
      body: {
        name: "Smash Warriors Elite",
        requiredMemberCount: 5,
        isAcceptingMembers: false,
      },
    }),
  );
  assert.equal(updatedEntry.statusCode, 200);
  assert.equal((updatedEntry.body as any).isAcceptingMembers, false);

  const confirmedLineup = await invoke(
    entryController.confirmLineup.bind(entryController),
    makeReq({ userId, params: { entryId: String(captainEntryId) } }),
  );
  assert.equal(confirmedLineup.statusCode, 200);
  assert.equal((confirmedLineup.body as any).isConfirmed, true);

  const deletedEntry = await invoke(
    entryController.delete.bind(entryController),
    makeReq({ userId, params: { entryId: String(captainEntryId) } }),
  );
  assert.equal(deletedEntry.statusCode, 204);

  assert.deepEqual(calls.map((call) => `${call.service}.${call.method}`), [
    "eloHistoryService.getByUser",
    "matchService.findMatchHistoryByAthlete",
    "matchService.findUpcomingMatchesByAthlete",
    "entryService.register",
    "entryService.register",
    "entryService.register",
    "entryService.getUserRoleInEntry",
    "entryService.getJoinRequests",
    "entryService.respondToJoinRequest",
    "entryService.respondToJoinRequest",
    "entryService.transferCaptaincy",
    "entryService.setRequiredMemberCount",
    "entryService.update",
    "entryService.confirmLineup",
    "entryService.delete",
  ]);
  assert.deepEqual(calls[0]?.args, [userId, { offset: 0, limit: 20 }]);
  assert.deepEqual(calls[1]?.args, [userId, 0, 10]);
  assert.deepEqual(calls[2]?.args, [userId, 0, 10]);
  assert.deepEqual(calls[3]?.args, [userId, singleCategoryId, "create_team", undefined, "Solo Smash"]);
  assert.deepEqual(calls[5]?.args, [userId, teamCategoryId, "join_team", targetEntryId, undefined]);
  assert.deepEqual(calls[7]?.args, [userId, captainEntryId, "pending", { offset: 0, limit: 10 }]);
  assert.deepEqual(calls[8]?.args, [userId, joinRequestId, "approve", undefined]);
  assert.deepEqual(calls[9]?.args, [
    userId,
    joinRequestId + 1,
    "reject",
    "Player is too strong for this category",
  ]);
  assert.deepEqual(calls[10]?.args, [userId, captainEntryId, 72]);
  assert.deepEqual(calls[11]?.args, [userId, captainEntryId, 5]);
  assert.deepEqual(calls[13]?.args, [userId, captainEntryId]);
  assert.deepEqual(calls[14]?.args, [userId, captainEntryId]);
});

test("organizer can build group-stage tournament brackets and full schedule", async (t) => {
  const calls: ServiceCall[] = [];
  const organizerId = organizerUserId;
  const tournamentId = 7001;
  const categoryId = 7101;
  const groupAssignments = [
    { groupName: "A", entryIds: [101, 102, 103, 104] },
    { groupName: "B", entryIds: [105, 106, 107, 108] },
  ];
  const qualifierEntryIds = [101, 105, 102, 106];

  patchMethods(t, groupStandingService, {
    generateGroupPreview: record(calls, "groupStandingService", "generateGroupPreview", [
      { groupName: "A", entries: [{ id: 101 }, { id: 102 }, { id: 103 }, { id: 104 }] },
      { groupName: "B", entries: [{ id: 105 }, { id: 106 }, { id: 107 }, { id: 108 }] },
    ]),
    saveGroupAssignments: record(calls, "groupStandingService", "saveGroupAssignments", {
      created: groupAssignments.length,
      groups: groupAssignments,
    }),
  });

  patchMethods(t, knockoutBracketService, {
    previewPlaceholders: record(calls, "knockoutBracketService", "previewPlaceholders", {
      bracketSize: 4,
      bracketTree: [{ round: "semifinal", entryAId: null, entryBId: null }],
    }),
    saveAssignments: async (userId: number, id: number, entryIds?: number[]) => {
      calls.push({
        service: "knockoutBracketService",
        method: "saveAssignments",
        args: [userId, id, entryIds],
      });
      return entryIds
        ? { saved: true, entryIds }
        : { saved: true, placeholders: 2 };
    },
    previewFillQualifiers: record(calls, "knockoutBracketService", "previewFillQualifiers", {
      entryIds: qualifierEntryIds,
      bracketTree: [
        { round: "semifinal", entryAId: 101, entryBId: 106 },
        { round: "semifinal", entryAId: 105, entryBId: 102 },
      ],
    }),
  });

  patchMethods(t, scheduleService, {
    generateTournamentSchedule: record(calls, "scheduleService", "generateTournamentSchedule", [
      {
        categoryId,
        result: {
          schedules: [{ id: 1, stage: "group" }, { id: 2, stage: "knockout" }],
          matches: [{ id: 11 }, { id: 12 }, { id: 13 }],
        },
      },
    ]),
  });

  const groupPreview = await invoke(
    groupStandingController.generatePlaceholders.bind(groupStandingController),
    makeReq({ userId: organizerId, body: { categoryId } }),
  );
  assert.equal(groupPreview.statusCode, 200);
  assert.equal((groupPreview.body as any).data.length, 2);

  const savedGroups = await invoke(
    groupStandingController.saveAssignments.bind(groupStandingController),
    makeReq({ userId: organizerId, body: { categoryId, groupAssignments } }),
  );
  assert.equal(savedGroups.statusCode, 201);
  assert.equal((savedGroups.body as any).data.created, 2);

  const knockoutPlaceholderPreview = await invoke(
    knockoutBracketController.previewPlaceholders.bind(knockoutBracketController),
    makeReq({ userId: organizerId, body: { categoryId } }),
  );
  assert.equal(knockoutPlaceholderPreview.statusCode, 200);
  assert.equal((knockoutPlaceholderPreview.body as any).data.bracketSize, 4);

  const savedPlaceholders = await invoke(
    knockoutBracketController.saveAssignments.bind(knockoutBracketController),
    makeReq({ userId: organizerId, body: { categoryId } }),
  );
  assert.equal(savedPlaceholders.statusCode, 201);
  assert.equal((savedPlaceholders.body as any).data.placeholders, 2);

  const fullSchedule = await invoke(
    scheduleController.generateTournamentSchedule.bind(scheduleController),
    makeReq({ userId: organizerId, body: { tournamentId } }),
  );
  assert.equal(fullSchedule.statusCode, 201);
  assert.equal((fullSchedule.body as any).data[0].totalMatches, 3);

  const qualifierPreview = await invoke(
    knockoutBracketController.previewFillQualifiers.bind(knockoutBracketController),
    makeReq({ userId: organizerId, body: { categoryId } }),
  );
  assert.equal(qualifierPreview.statusCode, 200);
  assert.deepEqual((qualifierPreview.body as any).data.entryIds, qualifierEntryIds);

  const filledQualifiers = await invoke(
    knockoutBracketController.saveAssignments.bind(knockoutBracketController),
    makeReq({ userId: organizerId, body: { categoryId, entryIds: qualifierEntryIds } }),
  );
  assert.equal(filledQualifiers.statusCode, 201);
  assert.deepEqual((filledQualifiers.body as any).data.entryIds, qualifierEntryIds);

  assert.deepEqual(calls.map((call) => `${call.service}.${call.method}`), [
    "groupStandingService.generateGroupPreview",
    "groupStandingService.saveGroupAssignments",
    "knockoutBracketService.previewPlaceholders",
    "knockoutBracketService.saveAssignments",
    "scheduleService.generateTournamentSchedule",
    "knockoutBracketService.previewFillQualifiers",
    "knockoutBracketService.saveAssignments",
  ]);
  assert.deepEqual(calls[0]?.args, [organizerId, categoryId]);
  assert.deepEqual(calls[1]?.args, [organizerId, categoryId, groupAssignments]);
  assert.deepEqual(calls[3]?.args, [organizerId, categoryId, undefined]);
  assert.deepEqual(calls[4]?.args, [organizerId, tournamentId]);
  assert.deepEqual(calls[6]?.args, [organizerId, categoryId, qualifierEntryIds]);
});

test("organizer can build direct knockout bracket and schedule", async (t) => {
  const calls: ServiceCall[] = [];
  const organizerId = organizerUserId;
  const categoryId = 7201;
  const entryIds = [201, 202, 203, 204, 205, 206, 207, 208];

  patchMethods(t, knockoutBracketService, {
    previewFromEntries: record(calls, "knockoutBracketService", "previewFromEntries", {
      entryIds,
      bracketTree: [{ round: "quarterfinal", entryAId: 201, entryBId: 208 }],
    }),
    saveAssignments: record(calls, "knockoutBracketService", "saveAssignments", {
      saved: true,
      entryIds,
    }),
  });

  patchMethods(t, scheduleService, {
    generateKnockoutSchedule: record(calls, "scheduleService", "generateKnockoutSchedule", {
      schedules: [{ id: 21, stage: "knockout" }, { id: 22, stage: "knockout" }],
      matches: [{ id: 31 }, { id: 32 }],
    }),
  });

  const knockoutPreview = await invoke(
    knockoutBracketController.previewFromEntries.bind(knockoutBracketController),
    makeReq({ userId: organizerId, body: { categoryId } }),
  );
  assert.equal(knockoutPreview.statusCode, 200);
  assert.deepEqual((knockoutPreview.body as any).data.entryIds, entryIds);

  const savedKnockout = await invoke(
    knockoutBracketController.saveAssignments.bind(knockoutBracketController),
    makeReq({ userId: organizerId, body: { categoryId, entryIds } }),
  );
  assert.equal(savedKnockout.statusCode, 201);
  assert.equal((savedKnockout.body as any).data.saved, true);

  const knockoutSchedule = await invoke(
    scheduleController.generateKnockoutSchedule.bind(scheduleController),
    makeReq({ userId: organizerId, body: { categoryId } }),
  );
  assert.equal(knockoutSchedule.statusCode, 201);
  assert.equal((knockoutSchedule.body as any).data.totalMatches, 2);

  assert.deepEqual(calls.map((call) => `${call.service}.${call.method}`), [
    "knockoutBracketService.previewFromEntries",
    "knockoutBracketService.saveAssignments",
    "scheduleService.generateKnockoutSchedule",
  ]);
  assert.deepEqual(calls[0]?.args, [organizerId, categoryId]);
  assert.deepEqual(calls[1]?.args, [organizerId, categoryId, entryIds]);
  assert.deepEqual(calls[2]?.args, [organizerId, categoryId, undefined]);
});
