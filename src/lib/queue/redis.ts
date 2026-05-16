import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const QUEUE_KEY = "storyforge:job_queue";
export const PROCESSING_KEY = "storyforge:processing";

export function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(
    url && url !== "your_redis_url" &&
    token && token !== "your_redis_token"
  );
}
