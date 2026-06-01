import { Redis } from "@upstash/redis"

// Create a single shared serverless Redis instance using env configuration
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

// Protected Redis GET with 1200ms timeout
export async function redisGet(key, timeoutMs = 1200) {
  let timer;
  try {
    const redisPromise = redis.get(key)
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis GET Timeout')), timeoutMs)
    })
    const result = await Promise.race([redisPromise, timeoutPromise])
    clearTimeout(timer)
    return result
  } catch (err) {
    clearTimeout(timer)
    console.warn(`[REDIS TIMEOUT/ERROR] GET ${key}:`, err)
    return null
  }
}

// Protected Redis SET with 1200ms timeout
export async function redisSet(key, value, options = {}, timeoutMs = 1200) {
  let timer;
  try {
    const redisPromise = redis.set(key, value, options)
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis SET Timeout')), timeoutMs)
    })
    const result = await Promise.race([redisPromise, timeoutPromise])
    clearTimeout(timer)
    return result
  } catch (err) {
    clearTimeout(timer)
    console.warn(`[REDIS TIMEOUT/ERROR] SET ${key}:`, err)
    return null
  }
}

// Protected Redis DEL with 1200ms timeout
export async function redisDel(key, timeoutMs = 1200) {
  let timer;
  try {
    const redisPromise = redis.del(key)
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis DEL Timeout')), timeoutMs)
    })
    const result = await Promise.race([redisPromise, timeoutPromise])
    clearTimeout(timer)
    return result
  } catch (err) {
    clearTimeout(timer)
    console.warn(`[REDIS TIMEOUT/ERROR] DEL ${key}:`, err)
    return null
  }
}
