const jwt = require('jsonwebtoken');

// Header formatı: "Authorization: Bearer <token>"
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token gerekli." });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token geçersiz veya süresi dolmuş." });
        }

        req.user = decoded;
        next();
    });
};

// authMiddleware'den sonra kullanılır: requireRole("ADMIN")
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
    }
    next();
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
