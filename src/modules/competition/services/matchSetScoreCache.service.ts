import config from "../../../config/config";
import { getRedisClient } from "../../../config/redis";
import MatchSet from "../models/matchSet.model";

export interface MatchSetScoreCache {
  id: number;
  subMatchId: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveMatchSetScoreCache {
  subMatchId: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
  updatedBy: number;
  updatedAt: string;
}

function scoreKey(setId: number): string {
  return `match-set:${setId}:score`;
}

function subMatchSetIdsKey(subMatchId: number): string {
  return `sub-match:${subMatchId}:match-set-ids`;
}

function liveScoreKey(subMatchId: number, setNumber: number): string {
  return `sub-match:${subMatchId}:set:${setNumber}:live-score`;
}

function toCacheValue(set: MatchSet): MatchSetScoreCache {
  const json = set.toJSON() as MatchSetScoreCache & {
    createdAt?: Date;
    updatedAt?: Date;
  };

  const value: MatchSetScoreCache = {
    id: json.id,
    subMatchId: json.subMatchId,
    setNumber: json.setNumber,
    entryAScore: json.entryAScore,
    entryBScore: json.entryBScore,
  };

  if (json.createdAt) {
    value.createdAt = new Date(json.createdAt).toISOString();
  }
  if (json.updatedAt) {
    value.updatedAt = new Date(json.updatedAt).toISOString();
  }

  return value;
}

export class MatchSetScoreCacheService {
  async setLiveScore(value: LiveMatchSetScoreCache): Promise<void> {
    const client = await getRedisClient();
    if (!client) return;

    const ttl = config.redis.matchSetScoreTtlSeconds;
    const payload = JSON.stringify(value);

    if (ttl > 0) {
      await client.set(liveScoreKey(value.subMatchId, value.setNumber), payload, { EX: ttl });
    } else {
      await client.set(liveScoreKey(value.subMatchId, value.setNumber), payload);
    }
  }

  async getLiveScore(
    subMatchId: number,
    setNumber: number
  ): Promise<LiveMatchSetScoreCache | null> {
    const client = await getRedisClient();
    if (!client) return null;

    const payload = await client.get(liveScoreKey(subMatchId, setNumber));
    if (!payload) return null;

    return JSON.parse(payload) as LiveMatchSetScoreCache;
  }

  async deleteLiveScore(subMatchId: number, setNumber: number): Promise<void> {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(liveScoreKey(subMatchId, setNumber));
  }

  async setScore(set: MatchSet): Promise<void> {
    const client = await getRedisClient();
    if (!client) return;

    const value = toCacheValue(set);
    const ttl = config.redis.matchSetScoreTtlSeconds;
    const payload = JSON.stringify(value);

    if (ttl > 0) {
      await client.set(scoreKey(set.id), payload, { EX: ttl });
    } else {
      await client.set(scoreKey(set.id), payload);
    }

    await client.zAdd(subMatchSetIdsKey(set.subMatchId), {
      score: set.setNumber,
      value: String(set.id),
    });

    if (ttl > 0) {
      await client.expire(subMatchSetIdsKey(set.subMatchId), ttl);
    }
  }

  async getScore(setId: number): Promise<MatchSetScoreCache | null> {
    const client = await getRedisClient();
    if (!client) return null;

    const payload = await client.get(scoreKey(setId));
    if (!payload) return null;

    return JSON.parse(payload) as MatchSetScoreCache;
  }

  async getScoresBySubMatch(subMatchId: number): Promise<MatchSetScoreCache[] | null> {
    const client = await getRedisClient();
    if (!client) return null;

    const ids = await client.zRange(subMatchSetIdsKey(subMatchId), 0, -1);
    if (ids.length === 0) return null;

    const values = await Promise.all(ids.map((id) => client.get(scoreKey(Number(id)))));
    const scores = values
      .filter((value): value is string => value !== null)
      .map((value) => JSON.parse(value) as MatchSetScoreCache);

    return scores.length > 0 ? scores : null;
  }

  async deleteScore(set: MatchSet): Promise<void> {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(scoreKey(set.id));
    await client.zRem(subMatchSetIdsKey(set.subMatchId), String(set.id));
  }
}

export default new MatchSetScoreCacheService();
