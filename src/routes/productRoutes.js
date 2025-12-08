const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

//ürün oluşturma
router.post('/', authMiddleware, productController.createProduct);
// ürün listeleme
router.get('/', authMiddleware, productController.getProducts);
// id ile ürün getirme
router.get('/:id', authMiddleware, productController.getProductById);
router.put('/:id',authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
module.exports = router;