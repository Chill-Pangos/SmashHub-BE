export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Tournament Management
  TOURNAMENTS_VIEW: 'tournaments.view',
  TOURNAMENTS_CREATE: 'tournaments.create',
  TOURNAMENTS_UPDATE: 'tournaments.update',
  TOURNAMENTS_DELETE: 'tournaments.delete',
  TOURNAMENTS_MANAGE: 'tournaments.manage',

  // Match Management
  MATCHES_VIEW: 'matches.view',
  MATCHES_CREATE: 'matches.create',
  MATCHES_UPDATE: 'matches.update',
  MATCHES_DELETE: 'matches.delete',
  MATCHES_START: 'matches.start',
  MATCHES_REPORT_RESULT: 'matches.report_result',
  MATCHES_APPROVE_RESULT: 'matches.approve_result',

  // Schedule Management
  SCHEDULES_VIEW: 'schedules.view',
  SCHEDULES_CREATE: 'schedules.create',
  SCHEDULES_UPDATE: 'schedules.update',
  SCHEDULES_DELETE: 'schedules.delete',

  // Entry Management
  ENTRIES_VIEW: 'entries.view',
  ENTRIES_CREATE: 'entries.create',
  ENTRIES_UPDATE: 'entries.update',
  ENTRIES_DELETE: 'entries.delete',
  ENTRIES_APPROVE: 'entries.approve',

  // Team Management
  TEAMS_VIEW: 'teams.view',
  TEAMS_CREATE: 'teams.create',
  TEAMS_UPDATE: 'teams.update',
  TEAMS_DELETE: 'teams.delete',
  TEAMS_MANAGE_MEMBERS: 'teams.manage_members',

  // Complaint Management
  COMPLAINTS_VIEW: 'complaints.view',
  COMPLAINTS_CREATE: 'complaints.create',
  COMPLAINTS_UPDATE: 'complaints.update',
  COMPLAINTS_RESOLVE: 'complaints.resolve',
  COMPLAINTS_ASSIGN: 'complaints.assign',

  // ELO Management
  ELO_VIEW: 'elo.view',
  ELO_MANAGE: 'elo.manage',

  // Role & Permission Management
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Notification Management
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_SEND: 'notifications.send',

  // Content Management
  CONTENT_VIEW: 'content.view',
  CONTENT_CREATE: 'content.create',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  CHIEF_REFEREE: 'chief_referee',
  REFEREE: 'referee',
  COACH: 'coach',
  TEAM_MANAGER: 'team_manager',
  ATHLETE: 'athlete',
  SPECTATOR: 'spectator',
} as const;
