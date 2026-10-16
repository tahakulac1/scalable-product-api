const { redis, isRedisReady } = require("../redis");

const CACHE_TTL_SECONDS = 3600;
const LIST_PREFIX = "products:list:";

const listKey = (page, limit) => `${LIST_PREFIX}page:${page}:limit:${limit}`;
const productKey = (id) => `products:id:${id}`;

async function getCache(key) {
    if (!isRedisReady()) return null;
    try {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (err) {
        console.error("Cache okuma hatası:", err.message);
        return null;
    }
}

async function setCache(key, value) {
    if (!isRedisReady()) return;
    try {
        await redis.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
    } catch (err) {
        console.error("Cache yazma hatası:", err.message);
    }
}

async function deleteCache(key) {
    if (!isRedisReady()) return;
    try {
        await redis.del(key);
    } catch (err) {
        console.error("Cache silme hatası:", err.message);
    }
}

// KEYS komutu büyük veride Redis'i kilitler; SCAN parça parça gezer
async function invalidateProductListCache() {
    if (!isRedisReady()) return;
    try {
        const stream = redis.scanStream({ match: `${LIST_PREFIX}*`, count: 100 });
        for await (const keys of stream) {
            if (keys.length) await redis.del(...keys);
        }
    } catch (err) {
        console.error("Cache temizleme hatası:", err.message);
    }
}

// Ürün listesi cache'te varsa veritabanına hiç gitmeden döndür
async function cacheProducts(req, res, next) {
    const { page, limit } = req.pagination;
    const cached = await getCache(listKey(page, limit));

    if (cached) {
        return res.json({ ...cached, cached: true });
    }
    next();
}

module.exports = {
    listKey,
    productKey,
    getCache,
    setCache,
    deleteCache,
    invalidateProductListCache,
    cacheProducts
};
