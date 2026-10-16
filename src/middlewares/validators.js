const MAX_PAGE_SIZE = 100;

// ?page=1&limit=10 → req.pagination = { page, limit }
exports.parsePagination = (req, res, next) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
        return res.status(400).json({ message: `page en az 1, limit 1-${MAX_PAGE_SIZE} arasında tam sayı olmalı.` });
    }

    req.pagination = { page, limit };
    next();
};

// /products/:id → req.productId
exports.parseIdParam = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "Geçersiz ürün id." });
    }

    req.productId = id;
    next();
};

// Create için name ve price zorunlu, update için ikisi de opsiyonel ama en az biri olmalı
exports.validateProductBody = ({ partial = false } = {}) => (req, res, next) => {
    const { name, price } = req.body ?? {};
    const data = {};

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "İsim boş olamaz." });
        }
        data.name = name.trim();
    }

    if (price !== undefined) {
        const parsed = Number(price);
        if (price === null || price === "" || !Number.isFinite(parsed) || parsed < 0) {
            return res.status(400).json({ message: "Fiyat 0 veya daha büyük bir sayı olmalı." });
        }
        data.price = parsed;
    }

    if (!partial && (data.name === undefined || data.price === undefined)) {
        return res.status(400).json({ message: "İsim ve fiyat zorunlu" });
    }
    if (partial && Object.keys(data).length === 0) {
        return res.status(400).json({ message: "Güncellenecek en az bir alan gönderin (name veya price)." });
    }

    req.productData = data;
    next();
};
