
const express = require('express');
const app = express();

app.use(express.json());


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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});
