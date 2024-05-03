const express = require('express');
const { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, getAllUsers, getProfile, updateProfile, newPassword, deleteUser, updateRole } = require('../controller/userController');
const router = express.Router();
const { isAuthenticated, authorizedRole } = require('../middleware/auth');

router.route("/auth/register").post(registerUser);
router.route("/auth/login").post(loginUser);
router.route('/auth/password/forgot').post(forgotPassword);
router.route('/auth/password/reset/:token').post(resetPassword);
router.route("/auth/logout").get(logoutUser);

router.route("/user/getAllUsers").get(isAuthenticated, authorizedRole('admin'), getAllUsers);
router.route("/user/profile").get(isAuthenticated, getProfile);
router.route("/user/profile/update").post(isAuthenticated, updateProfile);
router.route("/user/profile/updatePassword").post(isAuthenticated, newPassword);
router.route("/user/delete/:id").get(isAuthenticated, authorizedRole('admin'), deleteUser);
router.route("/user/updateUserRole/:id").post(isAuthenticated, authorizedRole('admin'), updateRole);

module.exports = router;        