const redisClient = require("../redis");

exports.cacheProducts = async (req, res, next) => {
    if (!redisClient) {
        console.log("[Cache Middleware] Redis client yok, pas geçiliyor.");
        return next();
    }

    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const cacheKey = `products:page:${page}:limit:${limit}`;
        
        console.log(`[Cache Middleware] Redis'te aranıyor: ${cacheKey}`);
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log("CACHE'DEN VERİ GELDİ!");
            return res.json({
                message: "Ürün listesi (cache)",
                data: JSON.parse(cachedData)
            });
        }

        console.log("[Cache Middleware] Cache'te bulunamadı, veritabanına gidiliyor...");
        req.cacheKey = cacheKey;
        next();

    } catch (err) {
        console.error("Cache middleware hatası:", err);
        next();
    }
};
exports.saveProductsCache = async (req, res, next) => {
    // DÜZELTME: ioredis kontrolü
    if (!redisClient || redisClient.status !== 'ready') {
        return next();
    }

    try {
        if (req.cacheKey && res.locals.products) {
            await redisClient.setex(
                req.cacheKey,
                3600,
                JSON.stringify(res.locals.products)
            );
        }
        next();

    } catch (err) {
        console.error("Cache yazma hatası", err);
        next();
    }
};