const prisma = require('../prismaClient');
const {
    listKey,
    productKey,
    getCache,
    setCache,
    deleteCache,
    invalidateProductListCache
} = require('../middlewares/cacheMiddleware');

// Prisma: güncellenmek/silinmek istenen kayıt yoksa P2025 hatası verir
const isNotFound = (err) => err && err.code === "P2025";

exports.createProduct = async (req, res) => {
    try {
        const product = await prisma.product.create({
            data: req.productData
        });

        // Yeni ürün listelerde görünsün diye liste cache'ini temizle
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
        const { page, limit } = req.pagination;

        const products = await prisma.product.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { id: "asc" },
        });

        const body = {
            message: "Ürün listesi",
            page,
            limit,
            products,
        };

        await setCache(listKey(page, limit), body);

        return res.json({ ...body, cached: false });
    } catch (err) {
        console.error("Ürün listeleme hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};

exports.getProductsById = async (req, res) => {
    try {
        const id = req.productId;

        const cached = await getCache(productKey(id));
        if (cached) {
            return res.json({ message: "Ürün bulundu.", product: cached, cached: true });
        }

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({ message: "Ürün bulunamadı." });
        }

        await setCache(productKey(id), product);

        return res.json({
            message: "Ürün bulundu.",
            product,
            cached: false
        });
    } catch (err) {
        console.error("Ürün bulma hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası." });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const id = req.productId;

        const updated = await prisma.product.update({
            where: { id },
            data: req.productData,
        });

        await Promise.all([
            invalidateProductListCache(),
            deleteCache(productKey(id))
        ]);

        return res.json({
            message: "Ürün güncellendi",
            product: updated
        });
    } catch (err) {
        if (isNotFound(err)) {
            return res.status(404).json({ message: "Ürün bulunamadı." });
        }
        console.error("Ürün güncelleme hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const id = req.productId;

        await prisma.product.delete({
            where: { id },
        });

        await Promise.all([
            invalidateProductListCache(),
            deleteCache(productKey(id))
        ]);

        return res.json({
            message: "Ürün silindi",
        });
    } catch (err) {
        if (isNotFound(err)) {
            return res.status(404).json({ message: "Ürün bulunamadı." });
        }
        console.error("Ürün silme hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};
