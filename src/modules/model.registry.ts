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

export const moduleModels = [
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Token,
  Otp,
  Tournament,
  TournamentCategory,
  TournamentReferee,
  RefereeInvitation,
  Entry,
  EntryMember,
  JoinRequest,
  Payment,
  Schedule,
  ScheduleConfig,
  Match,
  MatchReferee,
  SubMatch,
  MatchSet,
  SubMatchPlayer,
  GroupStanding,
  KnockoutBracket,
  EloScore,
  EloHistory,
  Notification,
  AuditLog,
  CronLog,
];
