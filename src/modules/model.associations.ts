import AuditLog from "./admin/models/auditLog.model";
import CronLog from "./admin/models/cronLog.model";
import GroupStanding from "./competition/models/groupStanding.model";
import KnockoutBracket from "./competition/models/knockoutBracket.model";
import Match from "./competition/models/match.model";
import MatchReferee from "./competition/models/matchReferee.model";
import MatchSet from "./competition/models/matchSet.model";
import Schedule from "./competition/models/schedule.model";
import ScheduleConfig from "./competition/models/scheduleConfig.model";
import SubMatch from "./competition/models/subMatch.model";
import SubMatchPlayer from "./competition/models/subMatchPlayer.model";
import Otp from "./identity/models/otp.model";
import Permission from "./identity/models/permission.model";
import Role from "./identity/models/role.model";
import RolePermission from "./identity/models/rolePermission.model";
import Token from "./identity/models/token.model";
import User from "./identity/models/user.model";
import UserRole from "./identity/models/userRole.model";
import Notification from "./notification/models/notification.model";
import EloHistory from "./ranking/models/eloHistory.model";
import EloScore from "./ranking/models/eloScore.model";
import Entry from "./registration/models/entry.model";
import EntryMember from "./registration/models/entryMember.model";
import JoinRequest from "./registration/models/joinRequest.model";
import Payment from "./registration/models/payment.model";
import RefereeInvitation from "./tournament/models/refereeInvitation.model";
import Tournament from "./tournament/models/tournament.model";
import TournamentCategory from "./tournament/models/tournamentCategory.model";
import TournamentReferee from "./tournament/models/tournamentReferee.model";

let registered = false;

export function registerModelAssociations(): void {
  if (registered) return;
  registered = true;

  User.hasOne(EloScore, { foreignKey: "userId", as: "eloScore" });
  User.hasMany(EloHistory, { foreignKey: "userId", as: "eloHistories" });
  User.hasMany(EntryMember, { foreignKey: "userId", as: "entryMembers" });
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: "userId",
    otherKey: "roleId",
    as: "roles",
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: "roleId",
    otherKey: "userId",
    as: "users",
  });
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "roleId",
    otherKey: "permissionId",
    as: "permissions",
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permissionId",
    otherKey: "roleId",
    as: "roles",
  });

  UserRole.belongsTo(User, { foreignKey: "userId", as: "user" });
  UserRole.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  RolePermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  RolePermission.belongsTo(Permission, { foreignKey: "permissionId", as: "permission" });
  Token.belongsTo(User, { foreignKey: "userId", as: "user" });
  Otp.belongsTo(User, { foreignKey: "userId", as: "user" });

  Tournament.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
  Tournament.hasMany(TournamentCategory, { foreignKey: "tournamentId", as: "categories" });
  Tournament.hasMany(TournamentReferee, { foreignKey: "tournamentId", as: "referees" });
  Tournament.hasOne(ScheduleConfig, { foreignKey: "tournamentId", as: "scheduleConfig" });

  TournamentCategory.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });
  TournamentCategory.hasMany(Entry, { foreignKey: "categoryId", as: "entries" });
  TournamentCategory.hasMany(Schedule, { foreignKey: "categoryId", as: "schedules" });

  TournamentReferee.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });
  TournamentReferee.belongsTo(User, { foreignKey: "refereeId", as: "referee" });

  RefereeInvitation.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });
  RefereeInvitation.belongsTo(User, { foreignKey: "refereeId", as: "referee" });
  RefereeInvitation.belongsTo(User, { foreignKey: "invitedBy", as: "inviter" });

  Entry.belongsTo(TournamentCategory, { foreignKey: "categoryId", as: "category" });
  Entry.belongsTo(User, { foreignKey: "captainId", as: "captain" });
  Entry.hasMany(EntryMember, { foreignKey: "entryId", as: "members" });
  Entry.hasMany(Match, { foreignKey: "entryAId", as: "matchesAsA" });
  Entry.hasMany(Match, { foreignKey: "entryBId", as: "matchesAsB" });
  Entry.hasMany(Match, { foreignKey: "winnerEntryId", as: "wonMatches" });

  EntryMember.belongsTo(Entry, { foreignKey: "entryId", as: "entry" });
  EntryMember.belongsTo(User, { foreignKey: "userId", as: "user" });
  JoinRequest.belongsTo(Entry, { foreignKey: "entryId", as: "entry" });
  JoinRequest.belongsTo(User, { foreignKey: "userId", as: "user" });
  Payment.belongsTo(Entry, { foreignKey: "entryId", as: "entry" });
  Payment.belongsTo(User, { foreignKey: "confirmedBy", as: "confirmer" });

  Schedule.belongsTo(TournamentCategory, { foreignKey: "categoryId", as: "tournamentCategory" });
  Schedule.hasMany(Match, { foreignKey: "scheduleId", as: "scheduledMatches" });
  ScheduleConfig.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });

  Match.belongsTo(Schedule, { foreignKey: "scheduleId", as: "schedule" });
  Match.belongsTo(Entry, { foreignKey: "entryAId", as: "entryA" });
  Match.belongsTo(Entry, { foreignKey: "entryBId", as: "entryB" });
  Match.belongsTo(Entry, { foreignKey: "winnerEntryId", as: "winnerEntry" });
  Match.hasMany(EloHistory, { foreignKey: "matchId", as: "eloHistories" });
  Match.hasMany(SubMatch, { foreignKey: "matchId", as: "subMatches" });
  Match.hasMany(MatchReferee, { foreignKey: "matchId", as: "matchReferees" });

  MatchReferee.belongsTo(Match, { foreignKey: "matchId", as: "match" });
  MatchReferee.belongsTo(User, { foreignKey: "refereeId", as: "referee" });
  SubMatch.belongsTo(Match, { foreignKey: "matchId", as: "match" });
  SubMatch.belongsTo(User, { foreignKey: "umpireId", as: "umpire" });
  SubMatch.belongsTo(User, { foreignKey: "assistantUmpireId", as: "assistantUmpire" });
  SubMatch.hasMany(MatchSet, { foreignKey: "subMatchId", as: "matchSets" });
  SubMatch.hasMany(SubMatchPlayer, { foreignKey: "subMatchId", as: "subMatchPlayers" });
  MatchSet.belongsTo(SubMatch, { foreignKey: "subMatchId", as: "subMatch" });
  SubMatchPlayer.belongsTo(SubMatch, { foreignKey: "subMatchId", as: "subMatch" });
  SubMatchPlayer.belongsTo(EntryMember, { foreignKey: "entryMemberId", as: "entryMember" });

  GroupStanding.belongsTo(TournamentCategory, { foreignKey: "categoryId", as: "category" });
  GroupStanding.belongsTo(Entry, { foreignKey: "entryId", as: "entry" });
  KnockoutBracket.belongsTo(TournamentCategory, { foreignKey: "categoryId", as: "category" });
  KnockoutBracket.belongsTo(Schedule, { foreignKey: "scheduleId", as: "schedule" });
  KnockoutBracket.belongsTo(Match, { foreignKey: "matchId", as: "match" });
  KnockoutBracket.belongsTo(Entry, { foreignKey: "entryAId", as: "entryA" });
  KnockoutBracket.belongsTo(Entry, { foreignKey: "entryBId", as: "entryB" });
  KnockoutBracket.belongsTo(Entry, { foreignKey: "winnerEntryId", as: "winnerEntry" });
  KnockoutBracket.belongsTo(KnockoutBracket, { foreignKey: "nextBracketId", as: "nextBracket" });
  KnockoutBracket.belongsTo(KnockoutBracket, { foreignKey: "previousBracketAId", as: "previousBracketA" });
  KnockoutBracket.belongsTo(KnockoutBracket, { foreignKey: "previousBracketBId", as: "previousBracketB" });

  EloScore.belongsTo(User, { foreignKey: "userId", as: "user" });
  EloHistory.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });
  EloHistory.belongsTo(Match, { foreignKey: "matchId", as: "match" });
  EloHistory.belongsTo(User, { foreignKey: "userId", as: "user" });

  Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
  AuditLog.belongsTo(User, { foreignKey: "actorUserId", as: "actor" });
  CronLog.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });
}
