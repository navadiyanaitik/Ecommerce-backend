const dbService = require("../utils/dbService");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const User = require("../model/users");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail.js");
const crypto = require("crypto");
const validation = require("../utils/validation/validateRequest.js");
const userKeys = require("../utils/validation/userValidation.js");
const { uploadFile, deleteFile, getSignedURL } = require("../services/aws.js");
const UserSession = require("../model/userSession.js");

// Register user

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const file = req.files?.avatar || {};
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const doj = Date.now();
  let BUCKET_NAME = process.env.S3_BUCKET_NAME;

  const isValidRequest = validation.validateParamsWithJoi(
    req.body,
    userKeys.registerUserSchemaKeys
  );
  if (!isValidRequest.isValid) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Data, Validation Failed." });
  }
  let imgURL;

  if (file && Object.keys(file).length > 0) {
    if (file.size > 1000000) {
      next(
        new ErrorHandler("file size must be less than or equals to 1MB", 400)
      );
    }
    const mimeTypes = /(^image)(\/)[a-zA-Z0-9_]*/gm;
    if (!mimeTypes.test(file.mimetype)) {
      next(new ErrorHandler("File Type must be image", 400));
    }
    let bucketName = `${BUCKET_NAME}/profiles`;
    const origialName = file.name;
    const _extention = origialName.substring(origialName.lastIndexOf("."));
    let fileDocName = `Profile-${Math.round(Math.random() * 1e8)}${_extention}`;
    await uploadFile(bucketName, file, fileDocName);
    imgURL = `profiles/${fileDocName}`;
  }

  const userObj = {
    name,
    email,
    password,
    doj,
  };
  if (imgURL) {
    userObj.avatar = imgURL;
  }

  let userExists = await dbService.findOne(User, { email });
  if (userExists) {
    res.status(400).json({ success: false, message: "User already exists" });
  } else {
    const user = await User.create(userObj);

    sendToken(user, 201, res);
  }
});

// Login user

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  const isValidRequest = validation.validateParamsWithJoi(
    req.body,
    userKeys.loginSchemaKeys
  );
  if (!isValidRequest.isValid) {
    res
      .status(400)
      .json({ success: false, message: "Invalid Data, Validation Failed." });
  }
  // if user has given password and email both
  if (!email || !password) {
    return next(new ErrorHandler("Please enter Email & Password", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 500));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 500));
  }
  const token = user.getJWTToken();
  await dbService.create(UserSession, {
    userId: user._id,
    token: token,
    isDeleted: false,
  });
  // sendToken(user, 200, res);
  res.status(200).json({ success: true, user, token });
});

// Logout User

exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "Logged Out Successfully" });
});

// Forgot password

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // const isValidRequest = validation.validateParamsWithJoi(req.body.email, userKeys.forgotPasswordSchemaKeys);
  // if (!isValidRequest.isValid) {
  //     return next(new ErrorHandler(isValidRequest.message, 400));
  // }
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("user not found", 404));
  }

  // Get resetPassword token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "origin"
  )}/reset_password/${resetToken}`;

  const message = `Your password reset token is \n \n ${resetPasswordUrl} \n \n If you have not requested than ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    return res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset password

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const isValidRequest = validation.validateParamsWithJoi(
    req.body,
    userKeys.resetPasswordSchemaKeys
  );
  if (!isValidRequest.isValid) {
    res.status(400).json({ success: false, message: isValidRequest.message });
    return next(new ErrorHandler(isValidRequest.message, 400));
  }
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired",
        400
      )
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, res);
});

// Delete User

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    next(new ErrorHandler(`User not found with ID:${req.params.id}`, 400));
  }

  await user.deleteOne();
  res.status(200).json({ success: true, message: "user deleted successfully" });
});

// Get all users

exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await dbService.findMany(User, {}, { password: 0 });
  if (!users) {
    return next(new ErrorHandler("Users not found", 400));
  }
  res.status(200).json({ success: true, users });
});

// get profile

exports.getProfile = catchAsyncErrors(async (req, res, next) => {
  let BUCKET_NAME = process.env.S3_BUCKET_NAME;

  const user = await dbService.findOne(
    User,
    { _id: req.user._id },
    { password: 0 }
  );
  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }
  res.status(200).json({ success: true, user: user });
});

// update user role

exports.updateRole = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }
  user.role = req.body.role;
  await user.save();
  res
    .status(201)
    .json({ success: true, message: "user role updated successfully" });
});

// Update Profile

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { email, name } = req.body;
  let file = req.files?.avatar || {};
  const isValidRequest = validation.validateParamsWithJoi(
    req.body,
    userKeys.updateProfileSchema
  );

  let BUCKET_NAME = process.env.S3_BUCKET_NAME;

  if (!isValidRequest.isValid) {
    res
      .status(400)
      .json({ success: false, message: "Invalid Data, Validation Failed." });
  }

  let imgURL;

  if (file && Object.keys(file).length > 0) {
    if (file.size > 1000000) {
      next(
        new ErrorHandler("file size must be less than or equals to 1MB", 400)
      );
    }
    const mimeTypes = /(^image)(\/)[a-zA-Z0-9_]*/gm;
    if (!mimeTypes.test(file.mimetype)) {
      next(new ErrorHandler("File Type must be image", 400));
    }

    let currentProfile = await dbService.findOne(User, { _id: req.user._id });
    if (currentProfile?.avatar && Object.keys(file).length > 0) {
      let fileUrl = currentProfile.avatar;
      await deleteFile(BUCKET_NAME, fileUrl);
    }
    let bucketName = `${BUCKET_NAME}/profiles`;

    const origialName = file.name;
    const _extention = origialName.substring(origialName.lastIndexOf("."));
    let fileDocName = `Profile-${Math.round(Math.random() * 1e8)}${_extention}`;
    await uploadFile(bucketName, file, fileDocName);
    imgURL = `profiles/${fileDocName}`;
  }
  const userObj = {
    name,
    email,
  };
  if (imgURL) {
    userObj.avatar = imgURL;
  }

  const user = await dbService.updateOne(
    User,
    { _id: req.user._id },
    { $set: userObj },
    { new: true, select: "-password" }
  );
  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }
  console.log("🚀 ~ exports.updateProfile=catchAsyncErrors ~ user:", user);
  res.status(200).json({ success: true, user });
});

// Update Role

exports.newPassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById({ _id: req.user._id });
  if (!user) {
    next(new ErrorHandler("User not found", 400));
  }

  const isPasswordMatched = await user.comparePassword(oldPassword);
  if (isPasswordMatched) {
    user.password = newPassword;
    await user.save();

    res
      .status(201)
      .json({ success: true, message: "Your password updated successfully" });
  } else {
    next(new ErrorHandler("your old password does not match", 400));
  }
});
