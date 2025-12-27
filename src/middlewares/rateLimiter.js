console.log("RATE LIMITER ÇALIŞTI");

const redis = require("../redis");

const rateLimiter = (limit = 50, windowMs = 60_000) => {
    return async (req, res, next) => {
        const ip = req.ip;
        const route = req.originalUrl;
        const key = `rate:${ip}:${route}`;
        const now = Date.now();
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
            return res.status(429).json({message:" Too many requests"});
        }

        next();

    };
};
module.exports = rateLimiter;
