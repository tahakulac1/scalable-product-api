require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET tanımlı değil. .env dosyasına ekleyin.");
  process.exit(1);
}

const express = require('express');
const rateLimiter = require('./middlewares/rateLimiter');
const authMiddleware = require('./middlewares/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Reverse proxy (nginx vb.) arkasında req.ip gerçek istemci IP'si olsun
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Rate limiter en başta: bozuk/büyük gövdeli istekler de limite takılsın
app.use(rateLimiter(50, 60_000));
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: "API çalışıyor" });
});

app.get('/protected', authMiddleware, (req, res) => {
  res.json({
    message: "Korumalı endpoint'e başarıyla girdin.",
    user: req.user
  });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint bulunamadı." });
});

// Bozuk JSON gövdesi vb. beklenmeyen hatalar
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Geçersiz JSON." });
  }
  console.error("Beklenmeyen hata:", err);
  res.status(500).json({ message: "Sunucu hatası" });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server çalışıyor: ${PORT}`);
  });
}

module.exports = app;
