const express = require('express');
const router = express.Router();

router.use('/api/v1/product', require('./productRoute'));
router.use('/api/v1/auth', require('./userRoute'));
module.exports = router;