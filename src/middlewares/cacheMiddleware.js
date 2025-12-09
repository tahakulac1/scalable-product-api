const redisClient = require("../redis");

exports.cacheProducts = async (req ,res, next) => {


    try {
        const cachedData= await redisClient.get("products");

        if (cachedData) {
            console.log("Cache'den veri geldi!");
            return res.json({
                message:"Ürün listesi (cache)",
                data: JSON.parse(cachedData)
            });
        }
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