import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const cleanEnvVar = (val) => val ? val.replace(/^['"]|['"]$/g, '') : val;

// Initialize Redis serverless REST instance securely using environment keys
const redis = new Redis({
  url: cleanEnvVar(process.env.UPSTASH_REDIS_REST_URL),
  token: cleanEnvVar(process.env.UPSTASH_REDIS_REST_TOKEN)
})

// Create and export a sliding window rate limiter: maximum 5 requests per 1 minute
export const orderRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true
})
