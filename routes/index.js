const express = require('express');
const router = express.Router();

router.use('/api/v1/product', require('./productRoute'));
router.use('/api/v1', require('./userRoute'));
router.use('/api/v1/order', require('./orderRoute'));
module.exports = router;