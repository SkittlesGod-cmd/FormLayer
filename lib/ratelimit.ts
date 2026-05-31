import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // graceful no-op if env vars not set
  _ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 AI requests per minute per user
    analytics: false,
    prefix: "fl_ai",
  });
  return _ratelimit;
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const rl = getRatelimit();
  if (!rl) return { allowed: true, remaining: 999 }; // no-op if Upstash not configured
  const { success, remaining } = await rl.limit(userId);
  return { allowed: success, remaining };
}
