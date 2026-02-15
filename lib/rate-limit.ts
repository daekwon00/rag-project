import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRatelimit(
  config: { requests: number; window: string; type?: "sliding" | "fixed" }
): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[RateLimit] Upstash 환경변수 미설정 — rate limiting 비활성화");
    return null;
  }

  const redis = Redis.fromEnv();
  const limiter = config.type === "fixed"
    ? Ratelimit.fixedWindow(config.requests, config.window as Parameters<typeof Ratelimit.fixedWindow>[1])
    : Ratelimit.slidingWindow(config.requests, config.window as Parameters<typeof Ratelimit.slidingWindow>[1]);

  return new Ratelimit({
    redis,
    limiter,
  });
}

// 채팅: 분당 20회, sliding window
export const chatLimiter = createRatelimit({ requests: 20, window: "1 m", type: "sliding" });

// 문서 수집: 분당 5회, fixed window
export const ingestLimiter = createRatelimit({ requests: 5, window: "1 m", type: "fixed" });

// 문서 삭제: 분당 10회, sliding window
export const documentLimiter = createRatelimit({ requests: 10, window: "1 m", type: "sliding" });

// rate limit 체크 헬퍼 — 초과 시 429 Response, 통과 시 null
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<Response | null> {
  if (!limiter) return null;

  const result = await limiter.limit(identifier);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}
