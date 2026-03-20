console.log("RATE LIMITER ÇALIŞTI");

const redis = require("../redis");

const memoryStore = new Map();

const rateLimiter = (limit = 50, windowMs = 60_000) => {
    return async (req, res, next) => {
        const ip = req.ip;
        const route = req.originalUrl;
        const key = `rate:${ip}:${route}`;
        const now = Date.now();

        // REDIS VARSA (HER REQUEST'TE KONTROL)
        if (redis && redis.isOpen) {
            try {
                const luaScript = `
                  redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
                  redis.call('ZADD', KEYS[1], ARGV[2], ARGV[2])
                  redis.call('EXPIRE', KEYS[1], ARGV[3])
                  return redis.call('ZCARD', KEYS[1])
                `;

                const count = await redis.eval(luaScript, {
                    keys: [key],
                    arguments: [
                        String(now - windowMs),
                        String(now),
                        String(Math.ceil(windowMs / 1000))
                    ]
                });

                if (count > limit) {
                    return res.status(429).json({ message: "Too many requests" });
                }

                return next();
            } catch (err) {
                console.error("Rate limiter redis hatası:", err);
                return next();
            }
        }

        // REDIS YOKSA (MEMORY)
        const entry = memoryStore.get(key) || [];
        const recent = entry.filter(ts => now - ts < windowMs);
        recent.push(now);
        memoryStore.set(key, recent);

        if (recent.length > limit) {
            return res.status(429).json({ message: "Too many requests (memory)" });
        }

        next();
    };
};

module.exports = rateLimiter;
