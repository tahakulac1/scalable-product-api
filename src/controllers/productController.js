const prisma = require('../prismaClient');
const redisClient = require('../redis');


async function invalidateProductListCache() {
    const keys = await redisClient.keys("products:page:*");
    if (keys.length) await redisClient.del(keys);
}

exports.createProduct = async (req, res) => {
    try {
        const {name, price } = req.body;

        if (!name || price === undefined) {

            return res.status(400).json({message: "İsim ve fiyat zorunlu"});

        }
        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price)
            }
        });

        await invalidateProductListCache();

        return res.status(201).json({
            message: "Ürün oluşturuldu",
            product
        });
    }catch (err) {
        console.error("Ürün oluşturma hatası:", err);
        return res.status(500).json({message: "Sunucu hatası"});
    }

  
};

exports.getProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page-1) * limit;

        const products = await prisma.product.findMany({
            skip,
            take: limit,
            orderBy: {id: "asc"},
        });

        await redisClient.setEx(
            req.cacheKey,
            3600,
            JSON.stringify(products)
        );

        return res.json({
            message: "Ürün listesi",
            page,
            limit,
            products,
        });
    
    }catch (err){
        console.error("Ürün listeleme hatası:",err);
        return res.status(500).json({ message: "Sunucu hatası" });

    }

};
exports.getProductsById = async (req, res)=> {
    try {
        const id = Number(req.params.id);

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({message: "Ürün bulunamadı."});

        }

        await redisClient.setEx(
            'products:id:${id}',
            3600,
            JSON.stringify(product)
        );

        return res.json({
            message: "Ürün bulundu.",
            product,
        });

    }catch (err) {
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

        const updated = await prisma.product.update({
            where: { id },
            data: {
                name: name ?? undefined,
                price: price ? parseFloat(price) : undefined
            }
        });

        await invalidateProductListCache();
        await redisClient.del('products:id:${id}');

        return res.json({
            message: "Ürün güncellendi",
            product: updated
        });

    } catch (err) {
        console.error("Ürün güncelleme hatası:", err);
        return res.status(500).json({message: "Sunucu hatası"});

    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const deleted = await prisma.product.delete({
            where: { id }
        });

        await invalidateProductListCache();
        await redisClient.del('products:id:${id}');
        
        return res.json({
            message: "Ürün silindi",
            deleted
        });

    } catch (err) {
        console.error("Ürün silme hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası"});
    }
};
