const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let users = []; // veritabanı yok mock array kullanıyoruz

exports.register = async (req, res) => {
    
    try{
        const { email, password } = req.body;

    if(!email || !password)
        return res.status(400).json({ message: "Email ve şifre zorunlu."});
    

    const existingUser = users.find(u => u.email === email);
    if (existingUser)
        return res.status(400).json({message: "Bu email zaten kayıtlı."});
        
    
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser  = { email, password: hashedPassword};
    users.push(newUser);

    res.json({ message: "Kayıt başarılı."});
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
    
    const user = users.find(u => u.email === email);
    if (!user)
        return res.status(400).json({ message: "Kullanıcı bulunamadı."});
    

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch)
        return res.status(400).json({ message: "Yanlış şifre."});


    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET || "secretkey",
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
