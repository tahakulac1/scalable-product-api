const crypto = require("crypto");
const { redis, isRedisReady } = require("../redis");

// Sliding window: pencere içindeki istekleri zaman damgasıyla sorted set'te tutar.
// Tek bir Lua script'i olduğu için Redis'te atomik çalışır (aynı anda gelen istekler yarışmaz).
const SLIDING_WINDOW_LUA = `
  redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
  redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3])
  redis.call('PEXPIRE', KEYS[1], ARGV[4])
  return redis.call('ZCARD', KEYS[1])
`;

const memoryStore = new Map();

// Redis yokken kullanılan bellek deposunda süresi dolmuş kayıtları temizle
function cleanupMemoryStore(windowMs) {
    const now = Date.now();
    for (const [key, timestamps] of memoryStore) {
        const recent = timestamps.filter(ts => now - ts < windowMs);
        if (recent.length) memoryStore.set(key, recent);
        else memoryStore.delete(key);
    }
}

const rateLimiter = (limit = 50, windowMs = 60_000) => {
    setInterval(() => cleanupMemoryStore(windowMs), windowMs).unref();

    return async (req, res, next) => {
        // Query string'i anahtara katma, yoksa ?page=1, ?page=2 ... limiti atlatır
        const key = `rate:${req.ip}`;
        const now = Date.now();

        if (isRedisReady()) {
            try {
                // Aynı milisaniyede gelen iki istek birbirini ezmesin diye üyeye rastgele ek koyuyoruz
                const member = `${now}-${crypto.randomUUID()}`;
                const count = await redis.eval(
                    SLIDING_WINDOW_LUA,
                    1,
                    key,
                    now - windowMs,
                    now,
                    member,
                    windowMs
                );

                if (count > limit) {
                    return res.status(429).json({ message: "Too many requests" });
                }
                return next();
            } catch (err) {
                console.error("Rate limiter redis hatası, belleğe geçiliyor:", err.message);
            }
        }

        const recent = (memoryStore.get(key) || []).filter(ts => now - ts < windowMs);
        recent.push(now);
        memoryStore.set(key, recent);

        if (recent.length > limit) {
            return res.status(429).json({ message: "Too many requests" });
        }
        next();
    };
};

module.exports = rateLimiter;
