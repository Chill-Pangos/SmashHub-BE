import { getRedisClient } from "../config/redis";

export const TOURNAMENT_STATUS_REFRESH_CHANNEL = "tournament:status-schedule:refresh";

export async function publishTournamentStatusScheduleRefresh(): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  await client.publish(TOURNAMENT_STATUS_REFRESH_CHANNEL, Date.now().toString());
}
