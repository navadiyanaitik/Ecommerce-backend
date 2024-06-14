const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getProfile,
  updateProfile,
  newPassword,
  deleteUser,
  updateRole,
} = require("../controller/userController");
const router = express.Router();
const { isAuthenticated, authorizedRole } = require("../middleware/auth");
const upload = require("../middleware/multer");

router.route("/auth/register").post(registerUser); // done
router.route("/auth/login").post(loginUser); // done
router.route("/auth/password/forgot").post(forgotPassword); // done
router.route("/auth/password/reset/:token").post(resetPassword); // done
router.route("/auth/logout").get(logoutUser); // done

router
  .route("/user/getAllUsers")
  .get(isAuthenticated, authorizedRole("admin"), getAllUsers); // done
router.route("/user/profile").get(isAuthenticated, getProfile); // done
router.route("/user/profile/update").post(isAuthenticated, updateProfile); // pending profile upload
router.route("/user/profile/updatePassword").post(isAuthenticated, newPassword); // done
router
  .route("/user/delete/:id")
  .get(isAuthenticated, authorizedRole("admin"), deleteUser); // done
router
  .route("/user/updateUserRole/:id")
  .post(isAuthenticated, authorizedRole("admin"), updateRole); // done

module.exports = router;
