const prisma = require('../prismaClient');
const redisClient = require('../redis');

// Yardımcı Fonksiyon: Liste cache'ini temizle (Redis açıksa)
async function invalidateProductListCache() {
    if (!redisClient || redisClient.status !== 'ready') return;

    try {
        const keys = await redisClient.keys("products:page:*");
        if (keys.length) await redisClient.del(keys);
    } catch (err) {
        console.error("Cache temizleme hatası:", err);
    }
}

exports.createProduct = async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: "İsim ve fiyat zorunlu" });
        }
        
        const product = await prisma.product.create({
            data: {
                name,
                price: Number(price)
            }
        });

        // Redis açıksa listeyi temizle ki yeni ürün görünsün
        await invalidateProductListCache();

        return res.status(201).json({
            message: "Ürün oluşturuldu",
            product
        });
    } catch (err) {
        console.error("Ürün oluşturma hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await prisma.product.findMany({
            skip,
            take: limit,
            orderBy: { id: "asc" },
        });

        if (redisClient && req.cacheKey) {
            console.log(`[Controller] Veriler veritabanından çekildi, şimdi Redis'e yazılıyor: ${req.cacheKey}`);
            await redisClient.setex(
                req.cacheKey,
                3600,
                JSON.stringify(products)
            );
        } else {
             console.log("[Controller] Cache'e yazılamadı çünkü redisClient veya cacheKey eksik.");
        }
        
        return res.json({
            message: "Ürün listesi",
            page,
            limit,
            products,
        });

    } catch (err) {
        console.error("Ürün listeleme hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};

exports.getProductsById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({ message: "Ürün bulunamadı." });
        }

        // DÜZELTME: Redis bağlantısı anlık kontrol ediliyor
        if (redisClient && redisClient.status !== 'ready') {
            await redisClient.setex(
                `products:id:${id}`,
                3600,
                JSON.stringify(product)
            );
        }

        return res.json({
            message: "Ürün bulundu.",
            product,
        });

    } catch (err) {
        console.error("Ürün bulma hatası:", err);
        return res.status(500).json({
            message: "Sunucu hatası."
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, price } = req.body;

        const updated = await prisma.$transaction(async (tx) => {
            return await tx.product.update({
                where: { id },
                data: {
                    name: name ?? undefined,
                    price: price ? parseFloat(price) : undefined
                },
            });
        });

        await invalidateProductListCache();
        
        // DÜZELTME: Redis bağlantısı anlık kontrol ediliyor
        if (redisClient && redisClient.status !== 'ready') {
            await redisClient.del(`products:id:${id}`);
        }

        return res.json({
            message: "Ürün güncellendi",
            product: updated
        });

    } catch (err) {
        console.error("Ürün güncelleme hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.$transaction(async (tx) => {
            await tx.product.delete({
                where: { id },
            });
        });

        await invalidateProductListCache();

        // DÜZELTME: Redis bağlantısı anlık kontrol ediliyor
        if (redisClient && redisClient.status !== 'ready') {
            await redisClient.del(`products:id:${id}`);
        }

        return res.json({
            message: "Ürün silindi",
        });

    } catch (err) {
        console.error("Ürün silme hatası:", err.message);
        return res.status(500).json({ message: err.message });
    }
};