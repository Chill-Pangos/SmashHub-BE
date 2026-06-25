const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "src");
const modulesRoot = path.join(srcRoot, "modules");
const publicModelFreeLeaves = new Set(["notification", "ranking", "registration", "identity"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && fullPath.endsWith(".ts")) files.push(fullPath);
  }
  return files;
}

function moduleNameFor(filePath) {
  const relative = path.relative(modulesRoot, filePath);
  const [moduleName] = relative.split(path.sep);
  return moduleName && !moduleName.endsWith(".ts") ? moduleName : null;
}

function extractImports(source) {
  const specs = [];
  const importExportRe = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const re of [importExportRe, dynamicImportRe]) {
    let match;
    while ((match = re.exec(source)) !== null) {
      specs.push(match[1]);
    }
  }
  return specs;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, path.join(base, "index.ts")];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return `${base}.ts`;
}

const violations = [];

for (const filePath of walk(modulesRoot)) {
  const currentModule = moduleNameFor(filePath);
  if (!currentModule) continue;

  const source = fs.readFileSync(filePath, "utf8");
  for (const specifier of extractImports(source)) {
    const resolved = resolveImport(filePath, specifier);
    if (!resolved || !resolved.startsWith(modulesRoot)) continue;

    const targetModule = moduleNameFor(resolved);
    if (!targetModule || targetModule === currentModule) continue;

    if (
      publicModelFreeLeaves.has(currentModule) &&
      path.basename(resolved) === "public.models.ts"
    ) {
      violations.push({
        filePath,
        specifier,
        reason: `${currentModule} imports cross-module public models`,
      });
    }

    const relativeTarget = path.relative(path.join(modulesRoot, targetModule), resolved);
    const [firstSegment] = relativeTarget.split(path.sep);
    if (firstSegment === "contracts" || firstSegment === "ports") {
      violations.push({
        filePath,
        specifier,
        reason: `private cross-module ${firstSegment} import`,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Port boundary violations:");
  for (const violation of violations) {
    console.error(`- ${path.relative(repoRoot, violation.filePath)}: ${violation.specifier} (${violation.reason})`);
  }
  process.exit(1);
}

require("ts-node/register/transpile-only");

const { notificationService } = require("../src/modules/notification/public.services");
const { identityReadService } = require("../src/modules/identity/public.read");
const { competitionReadService } = require("../src/modules/competition/public.read");
const { tournamentReadService } = require("../src/modules/tournament/public.read");
const { rankingReadService } = require("../src/modules/ranking/public.read");
const { rankingWriteService } = require("../src/modules/ranking/public.write");
require("../src/modules/notification/public.contracts");
require("../src/modules/competition/public.contracts");
require("../src/modules/tournament/public.contracts");
require("../src/modules/ranking/public.contracts");

for (const [name, value] of [
  ["notificationService.notifyUser", notificationService.notifyUser],
  ["notificationService.notifyUsers", notificationService.notifyUsers],
  ["notificationService.publishMatchRealtime", notificationService.publishMatchRealtime],
  ["notificationService.publishCronLog", notificationService.publishCronLog],
  ["notificationService.emitRoomEvent", notificationService.emitRoomEvent],
  ["notificationService.getRealtimeMetrics", notificationService.getRealtimeMetrics],
  ["identityReadService.verifyToken", identityReadService.verifyToken],
  ["identityReadService.getAdminUserIds", identityReadService.getAdminUserIds],
  ["identityReadService.getRegistrationUser", identityReadService.getRegistrationUser],
  ["identityReadService.getRegistrationUsersByIds", identityReadService.getRegistrationUsersByIds],
  ["identityReadService.searchUserIdsByName", identityReadService.searchUserIdsByName],
  ["identityReadService.isAdmin", identityReadService.isAdmin],
  ["competitionReadService.matchExists", competitionReadService.matchExists],
  ["competitionReadService.getApprovedTournamentMatchesForElo", competitionReadService.getApprovedTournamentMatchesForElo],
  ["competitionReadService.getRegistrationWindow", competitionReadService.getRegistrationWindow],
  ["tournamentReadService.getTournamentForElo", tournamentReadService.getTournamentForElo],
  ["tournamentReadService.getCategoryRegistrationContext", tournamentReadService.getCategoryRegistrationContext],
  ["tournamentReadService.getCategoriesRegistrationContext", tournamentReadService.getCategoriesRegistrationContext],
  ["tournamentReadService.getCategoryPaymentContext", tournamentReadService.getCategoryPaymentContext],
  ["tournamentReadService.getAssignedChiefRefereeIds", tournamentReadService.getAssignedChiefRefereeIds],
  ["rankingReadService.getUserElo", rankingReadService.getUserElo],
  ["rankingReadService.getUserElos", rankingReadService.getUserElos],
  ["rankingReadService.getUserEloView", rankingReadService.getUserEloView],
  ["rankingReadService.getUserEloViews", rankingReadService.getUserEloViews],
  ["rankingWriteService.createInitialUserElo", rankingWriteService.createInitialUserElo],
]) {
  if (typeof value !== "function") {
    console.error(`Missing port method: ${name}`);
    process.exit(1);
  }
}

const { Match, Schedule, SubMatch } = require("../src/modules/competition/public.models");
const { TournamentCategory } = require("../src/modules/tournament/public.models");
const { Entry, EntryMember } = require("../src/modules/registration/public.models");

Match._validateIncludedElements({
  include: [
    {
      model: Schedule,
      as: "schedule",
      required: true,
      include: [{
        model: TournamentCategory,
        as: "tournamentCategory",
        where: { tournamentId: 1 },
        required: true,
      }],
    },
    { model: SubMatch, as: "subMatches", attributes: ["winnerTeam"] },
    {
      model: Entry,
      as: "entryA",
      include: [{ model: EntryMember, as: "members", attributes: ["userId"] }],
    },
    {
      model: Entry,
      as: "entryB",
      include: [{ model: EntryMember, as: "members", attributes: ["userId"] }],
    },
  ],
});

console.log("ports ok");
