const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require("../prismaClient");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (!email || !password)
            return res.status(400).json({ message: "Email ve şifre zorunlu." });

        if (!EMAIL_REGEX.test(email))
            return res.status(400).json({ message: "Geçerli bir email girin." });

        if (password.length < MIN_PASSWORD_LENGTH)
            return res.status(400).json({ message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` });

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser)
            return res.status(409).json({ message: "Bu email zaten kayıtlı." });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Rol her zaman varsayılan (USER) olur; istemci kendini ADMIN yapamaz
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        return res.status(201).json({
            message: "Kullanıcı oluşturuldu",
            userId: user.id
        });
    } catch (err) {
        console.error("Kayıt hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (!email || !password)
            return res.status(400).json({ message: "Email ve şifre zorunlu." });

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // "Kullanıcı yok" ve "şifre yanlış" için aynı cevap: hangi emaillerin kayıtlı olduğu dışarı sızmasın
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;
        if (!isMatch)
            return res.status(401).json({ message: "Email veya şifre hatalı." });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "Giriş başarılı",
            token
        });
    } catch (err) {
        console.error("Giriş yapma hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
    }
};
