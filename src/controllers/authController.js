const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require("../prismaClient");


exports.register = async (req, res) => {
    console.log("REGISTER DATABASE URL:", process.env.DATABASE_URL);
    await prisma.$queryRaw`SELECT 1`;
    console.log("DB CONNECTION OK");

    
    try{
    const { email, password } = req.body;

    if(!email || !password)
        return res.status(400).json({ message: "Email ve şifre zorunlu."});
    

    const existingUser = await prisma.user.findUnique({
        where: {email}
    });
    if (existingUser)
        return res.status(400).json({message: "Bu email zaten kayıtlı."});
        
    
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user  = await prisma.user.create({
        data: {
            email,
            password: hashedPassword
        }
    });
    return res.status(201).json({
        message: "Kullanıcı oluturuldu",
        userId: user.id
    });

    } catch (err) {
        console.error("Kayit hatasi", err);
        return res.status(500).json({ message: "Sunucu hatası"});
    }

};

exports.login = async (req, res) => {
   try{
     const { email, password } = req.body;

    if(!email || !password)
        return res.status(400).json({ message: "Email ve şifre zorunlu."});
    
    const user = await prisma.user.findUnique({
        where: { email}
    });
    if (!user)
        return res.status(400).json({ message: "Kullanıcı bulunamadı."});
    

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch)
        return res.status(400).json({ message: "Yanlış şifre."});


    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h"}
    );

    res.json({
        message: "Giriş başarılı",
        token
    });

   }catch (err) {
    console.error("Giriş yapma hatası", err);
    return res.status(500).json({ message: "Sunucu hatası"});
   }
};
