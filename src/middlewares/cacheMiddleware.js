const redisClient = require("../redis");

exports.cacheProducts = async (req ,res, next) => {


    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const cacheKey = 'products:page:${page}:limit:${limit}';
        const cachedData= await redisClient.get("cacheKey");

        if (cachedData) {
            console.log("Cache'den veri geldi!");
            return res.json({
                message:"Ürün listesi (cache)",
                data: JSON.parse(cachedData)
            });
        }

        req.cacheKey = cacheKey;
        next ();

    }catch (err) {
        console.error("Cache middleware hatası:", err);
        next();
    }
};

exports.saveProductsCache = async (req, res, next) => {
    try {
        await redisClient.setEx("products", 3600, JSON.stringify(res.local.products));
        next();

    }catch (err) {
        console.error("Cache yazma hatası", err);
        next();
    }
};