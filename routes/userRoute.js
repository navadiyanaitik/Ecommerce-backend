const express = require('express');
const { registerUser, loginUser, logoutUser, forgotPassword, resetPassword } = require('../controller/userController');
const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').post(resetPassword);
router.route("/logout").get(logoutUser);

module.exports = router;        