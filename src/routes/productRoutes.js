const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');


// ürün listeleme
router.get('/',
     authMiddleware,
     cacheMiddleware.cacheProducts,
     productController.getProducts);
//ürün oluşturma
router.post('/', authMiddleware, productController.createProduct);
// id ile ürün getirme
router.get('/:id', authMiddleware, productController.getProductsById);
router.put('/:id',authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
module.exports = router;