const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizedRole } = require('../middleware/auth');
const { getAllProducts, createProduct, deleteProduct, updateProduct, getProduct, createProductReview, getAllReviewsOfProduct, deleteProductReview } = require('../controller/productController');

// create product
router.route('/all').get(getAllProducts);
router.route('/create').post(isAuthenticated, authorizedRole("admin"), createProduct);
router.route('/:id').get(getProduct).put(isAuthenticated, authorizedRole("admin"), updateProduct).delete(isAuthenticated, authorizedRole("admin"), deleteProduct);
router.route('/rating').put(isAuthenticated, createProductReview);
router.route('/reviews')
    .get(getAllReviewsOfProduct)
    .delete(isAuthenticated, deleteProductReview)

module.exports = router;