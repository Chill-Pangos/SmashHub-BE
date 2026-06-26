const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "src");
const modulesRoot = path.join(srcRoot, "modules");
const scriptsRoot = path.join(repoRoot, "scripts");

function walk(dir, extensions = new Set([".ts"])) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath, extensions));
    else if (entry.isFile() && extensions.has(path.extname(fullPath))) files.push(fullPath);
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
  const requireRe = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const re of [importExportRe, dynamicImportRe, requireRe]) {
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

    if (path.basename(resolved) === "public.models.ts") {
      violations.push({
        filePath,
        specifier,
        reason: `${currentModule} imports ${targetModule} public models`,
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

for (const filePath of walk(scriptsRoot, new Set([".js"]))) {
  const source = fs.readFileSync(filePath, "utf8");
  for (const specifier of extractImports(source)) {
    const resolved = resolveImport(filePath, specifier);
    if (!resolved || !resolved.startsWith(modulesRoot)) continue;

    if (path.basename(resolved) === "public.models.ts") {
      violations.push({
        filePath,
        specifier,
        reason: "script imports module public models; use module diagnostics or public ports",
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
const { identityCleanupService } = require("../src/modules/identity/public.services");
const { adminWriteService } = require("../src/modules/admin/public.write");
const { identityReadService } = require("../src/modules/identity/public.read");
const { competitionReadService } = require("../src/modules/competition/public.read");
const { competitionWriteService } = require("../src/modules/competition/public.write");
const { registrationReadService } = require("../src/modules/registration/public.read");
const { tournamentReadService } = require("../src/modules/tournament/public.read");
const { tournamentStatusNotificationService } = require("../src/modules/tournament/public.services");
const { rankingReadService } = require("../src/modules/ranking/public.read");
const { rankingWriteService } = require("../src/modules/ranking/public.write");
const { validateTournamentEloIncludeGraph } = require("../src/modules/model.diagnostics");
require("../src/modules/notification/public.contracts");
require("../src/modules/admin/public.contracts");
require("../src/modules/competition/public.contracts");
require("../src/modules/registration/public.contracts");
require("../src/modules/tournament/public.contracts");
require("../src/modules/ranking/public.contracts");

for (const [name, value] of [
  ["notificationService.notifyUser", notificationService.notifyUser],
  ["notificationService.notifyUsers", notificationService.notifyUsers],
  ["notificationService.publishMatchRealtime", notificationService.publishMatchRealtime],
  ["notificationService.publishCronLog", notificationService.publishCronLog],
  ["notificationService.emitRoomEvent", notificationService.emitRoomEvent],
  ["notificationService.getRealtimeMetrics", notificationService.getRealtimeMetrics],
  ["adminWriteService.createAuditLog", adminWriteService.createAuditLog],
  ["identityReadService.verifyToken", identityReadService.verifyToken],
  ["identityReadService.isTokenBlacklisted", identityReadService.isTokenBlacklisted],
  ["identityReadService.getAuthenticatedUserByToken", identityReadService.getAuthenticatedUserByToken],
  ["identityReadService.getAdminUserIds", identityReadService.getAdminUserIds],
  ["identityReadService.getRegistrationUser", identityReadService.getRegistrationUser],
  ["identityReadService.getRegistrationUsersByIds", identityReadService.getRegistrationUsersByIds],
  ["identityReadService.searchUserIdsByName", identityReadService.searchUserIdsByName],
  ["identityReadService.isAdmin", identityReadService.isAdmin],
  ["identityReadService.getTournamentUser", identityReadService.getTournamentUser],
  ["identityReadService.getTournamentUsersByIds", identityReadService.getTournamentUsersByIds],
  ["identityReadService.userHasRole", identityReadService.userHasRole],
  ["identityReadService.userHasAnyRole", identityReadService.userHasAnyRole],
  ["identityReadService.getUserAccess", identityReadService.getUserAccess],
  ["identityReadService.userHasPermission", identityReadService.userHasPermission],
  ["identityReadService.userHasAnyPermission", identityReadService.userHasAnyPermission],
  ["identityReadService.userHasAllPermissions", identityReadService.userHasAllPermissions],
  ["identityReadService.getUserIdsByRoles", identityReadService.getUserIdsByRoles],
  ["identityReadService.findTournamentUsersByIds", identityReadService.findTournamentUsersByIds],
  ["identityCleanupService.cleanupExpiredOtps", identityCleanupService.cleanupExpiredOtps],
  ["identityCleanupService.cleanupExpiredAccessTokens", identityCleanupService.cleanupExpiredAccessTokens],
  ["identityCleanupService.cleanupExpiredRefreshTokens", identityCleanupService.cleanupExpiredRefreshTokens],
  ["competitionReadService.matchExists", competitionReadService.matchExists],
  ["competitionReadService.getApprovedTournamentMatchesForElo", competitionReadService.getApprovedTournamentMatchesForElo],
  ["competitionReadService.getRegistrationWindow", competitionReadService.getRegistrationWindow],
  ["competitionReadService.getTournamentScheduleConfig", competitionReadService.getTournamentScheduleConfig],
  ["competitionReadService.getScheduleConfigsByTournamentIds", competitionReadService.getScheduleConfigsByTournamentIds],
  ["competitionReadService.findScheduleConfigs", competitionReadService.findScheduleConfigs],
  ["competitionReadService.getNextScheduleConfigDate", competitionReadService.getNextScheduleConfigDate],
  ["competitionReadService.getOverlappingTournamentIds", competitionReadService.getOverlappingTournamentIds],
  ["competitionReadService.hasKnockoutBrackets", competitionReadService.hasKnockoutBrackets],
  ["competitionReadService.getKnockoutStandings", competitionReadService.getKnockoutStandings],
  ["competitionReadService.getTopGroupAwardStandings", competitionReadService.getTopGroupAwardStandings],
  ["competitionWriteService.generateKnockoutBracketForCategory", competitionWriteService.generateKnockoutBracketForCategory],
  ["registrationReadService.getEntryCategoryIdsByUserId", registrationReadService.getEntryCategoryIdsByUserId],
  ["registrationReadService.getEntriesByCategoryIds", registrationReadService.getEntriesByCategoryIds],
  ["registrationReadService.getCompetitionEntriesByIds", registrationReadService.getCompetitionEntriesByIds],
  ["registrationReadService.getCompetitionEntriesByCategoryId", registrationReadService.getCompetitionEntriesByCategoryId],
  ["registrationReadService.getCompetitionEntryIdsByUserId", registrationReadService.getCompetitionEntryIdsByUserId],
  ["registrationReadService.searchCompetitionEntryIdsByName", registrationReadService.searchCompetitionEntryIdsByName],
  ["registrationReadService.getEligibleEntriesByCategory", registrationReadService.getEligibleEntriesByCategory],
  ["registrationReadService.getEntryByNameInCategory", registrationReadService.getEntryByNameInCategory],
  ["registrationReadService.entryExistsInCategory", registrationReadService.entryExistsInCategory],
  ["registrationReadService.countEntriesByCategoryIds", registrationReadService.countEntriesByCategoryIds],
  ["registrationReadService.getEntryNamesByIds", registrationReadService.getEntryNamesByIds],
  ["registrationReadService.getEntriesWithMembersByIds", registrationReadService.getEntriesWithMembersByIds],
  ["registrationReadService.getEntryMembersByEntryIds", registrationReadService.getEntryMembersByEntryIds],
  ["registrationReadService.getCompetitionEntryMembersByIds", registrationReadService.getCompetitionEntryMembersByIds],
  ["registrationReadService.getCompetitionEntryMembersByEntryIds", registrationReadService.getCompetitionEntryMembersByEntryIds],
  ["registrationReadService.getCompetitionEntriesWithMembersByIds", registrationReadService.getCompetitionEntriesWithMembersByIds],
  ["registrationReadService.getCompletedPaymentEntryIds", registrationReadService.getCompletedPaymentEntryIds],
  ["registrationReadService.userCompetesInCategories", registrationReadService.userCompetesInCategories],
  ["registrationReadService.getParticipantUserIdsByCategoryIds", registrationReadService.getParticipantUserIdsByCategoryIds],
  ["tournamentReadService.getTournamentForElo", tournamentReadService.getTournamentForElo],
  ["tournamentReadService.getCategoryRegistrationContext", tournamentReadService.getCategoryRegistrationContext],
  ["tournamentReadService.getCategoriesRegistrationContext", tournamentReadService.getCategoriesRegistrationContext],
  ["tournamentReadService.getCategoryPaymentContext", tournamentReadService.getCategoryPaymentContext],
  ["tournamentReadService.getAssignedChiefRefereeIds", tournamentReadService.getAssignedChiefRefereeIds],
  ["tournamentReadService.getCategoryCompetitionContext", tournamentReadService.getCategoryCompetitionContext],
  ["tournamentReadService.getCategoriesCompetitionContext", tournamentReadService.getCategoriesCompetitionContext],
  ["tournamentReadService.getTournamentCompetitionContext", tournamentReadService.getTournamentCompetitionContext],
  ["tournamentReadService.getCategoryIdsByTournamentId", tournamentReadService.getCategoryIdsByTournamentId],
  ["tournamentReadService.getTournamentRefereeIds", tournamentReadService.getTournamentRefereeIds],
  ["tournamentReadService.getTournamentRefereeAssignments", tournamentReadService.getTournamentRefereeAssignments],
  ["tournamentReadService.isTournamentReferee", tournamentReadService.isTournamentReferee],
  ["tournamentReadService.getActiveTournamentIds", tournamentReadService.getActiveTournamentIds],
  ["tournamentStatusNotificationService.notifyTransitions", tournamentStatusNotificationService.notifyTransitions],
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

validateTournamentEloIncludeGraph();

console.log("ports ok");
