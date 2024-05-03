const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizedRole } = require('../middleware/auth');
const { getAllProducts, createProduct, deleteProduct, updateProduct, getProduct } = require('../controller/productController');

// create product
router.route('/all').get(getAllProducts);
router.route('/create').post(isAuthenticated, authorizedRole("admin"), createProduct);
router.delete('/:id', isAuthenticated, authorizedRole("admin"), deleteProduct);
router.post('/:id', isAuthenticated, authorizedRole("admin"), updateProduct);
router.get('/:id', getProduct);

module.exports = router;