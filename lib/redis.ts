import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/** Shared Upstash Redis client for anything written from the public site (memories, tasks). */
export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("התכונה הזו לא מוגדרת עדיין (חסרים משתני סביבה של Upstash)");
    }
    redis = new Redis({ url, token });
  }
  return redis;
}
