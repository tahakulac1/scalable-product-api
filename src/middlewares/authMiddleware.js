const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader)
        return res.status(401).json({ mesasage: "Token gerekli,"});
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
        if(err)
            return res.status(401).json({ message: "Token geçersiz"});

        req.user = decoded;
        next();
    });
};