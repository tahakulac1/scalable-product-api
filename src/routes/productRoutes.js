const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/authMiddleware');
const { cacheProducts } = require('../middlewares/cacheMiddleware');
const { parsePagination, parseIdParam, validateProductBody } = require('../middlewares/validators');

// Okuma: giriş yapmış her kullanıcı
router.get('/',
    authMiddleware,
    parsePagination,
    cacheProducts,
    productController.getProducts);

router.get('/:id',
    authMiddleware,
    parseIdParam,
    productController.getProductsById);

// Yazma: sadece ADMIN
router.post('/',
    authMiddleware,
    requireRole('ADMIN'),
    validateProductBody(),
    productController.createProduct);

router.put('/:id',
    authMiddleware,
    requireRole('ADMIN'),
    parseIdParam,
    validateProductBody({ partial: true }),
    productController.updateProduct);

router.delete('/:id',
    authMiddleware,
    requireRole('ADMIN'),
    parseIdParam,
    productController.deleteProduct);

module.exports = router;
