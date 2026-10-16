const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_ENABLED === "true") {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    // Bağlantı koparsa en fazla 5 saniyede bir tekrar dene
    retryStrategy: (times) => Math.min(times * 500, 5000)
  });

  redis.on("ready", () => {
    console.log("Redis bağlı");
  });

  redis.on("error", (err) => {
    console.warn("Redis hata, cache pas geçiliyor:", err.message);
  });
} else {
  console.log("Redis devre dışı (REDIS_ENABLED=false)");
}

// ioredis'te bağlantı durumu `status` alanından okunur ("ready" = komut almaya hazır)
const isRedisReady = () => redis !== null && redis.status === "ready";

module.exports = { redis, isRedisReady };
