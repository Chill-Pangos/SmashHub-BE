import type { NotificationType } from "./models/notification.model";

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: unknown;
  timestamp?: Date;
}

export interface NotificationCommandInput {
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: number;
  referenceType?: string;
  data?: unknown;
}

export type MatchRealtimeEventType =
  | "match_started"
  | "sub_match_players_assigned"
  | "sub_match_started"
  | "live_score_updated"
  | "set_created"
  | "set_score_updated"
  | "set_deleted"
  | "sub_match_finalized"
  | "match_result_submitted"
  | "match_result_approved";

export interface MatchRealtimePayload {
  roomId: string;
  matchId: number;
  type: MatchRealtimeEventType;
  data: unknown;
  occurredAt: string;
}

export interface RealtimeCronLogPayload {
  id?: number;
  jobName: string;
  tournamentId?: number | null;
  level: string;
  status: string;
  message: string;
  meta?: unknown;
  startedAt: Date | string;
  finishedAt?: Date | string | null;
  durationMs?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface RealtimeMetrics {
  totalConnectedUsers: number;
  roomCount: number;
  adapterMode: "memory" | "redis";
  lastSocketError: string | null;
}
