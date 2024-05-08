const express = require('express');
const router = express.Router();
const { createOrder, getOrderDetails, myOrders, getAllOrders, updateOrder, deleteOrder } = require('../controller/orderController');
const { isAuthenticated, authorizedRole } = require('../middleware/auth');

router.route('/new').post(isAuthenticated, createOrder);
router.route('/myOrders').get(isAuthenticated, myOrders);
router.route('/all').get(isAuthenticated, authorizedRole('admin'), getAllOrders);
router
    .route('/:id')
    .put(isAuthenticated, authorizedRole('admin'), updateOrder)
    .delete(isAuthenticated, authorizedRole('admin'), deleteOrder)
    .get(getOrderDetails)
module.exports = router;            