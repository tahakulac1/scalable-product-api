require('dotenv').config();
const rateLimiter = require('./middlewares/rateLimiter');
const express = require('express');
require("./redis");
const app = express();

app.use(express.json());
app.use(rateLimiter(50, 60000));

const authMiddleware = require('./middlewares/authMiddleware');

app.get('/', (req, res) => {
  res.send({ message: "API çalışıyor" });
});

app.get('/protected', authMiddleware, (req, res) => {
  res.json({
    message: "Korumalı endpoint'e başarıyla girdin.",
    user: req.user
  });
});

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/products', productRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server çalışıyor: ${PORT}`);
});
// tekrar push zart zurt işlemlerini yapıcaz tekrar denicez. en son bu dosyada bir şeyler değiştirdik burda bıraktık 