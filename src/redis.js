const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_ENABLED === "true") {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });

    redis.on("connect", () => {
      console.log("Redis bağlı");
    });

    redis.on("error", (err) => {
      console.warn("Redis hata, cache pas geçiliyor:", err.message);
    });

  } catch (err) {
    console.warn("Redis başlatılamadı:", err.message);
    redis = null;
  }
} else {
  console.log("Redis devre dışı (REDIS_ENABLED=false)");
}

module.exports = redis;
