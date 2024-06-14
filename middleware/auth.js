const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const User = require("../model/users");
const dbService = require("../utils/dbService");
const UserSession = require("../model/userSession");

exports.isAuthenticated = catchAsyncError(async (req, res, next) => {
  let token = req.headers.authorization.replace("Bearer ", "");
  if (!token) {
    next(new ErrorHandler("Please login to access this resource", 400));
  }
  let decodedData = jwt.verify(token, process.env.JWT_SECRET);

  // let userSession = dbService.findOne(UserSession, {
  //   token,
  //   userId: decodedData?.id,
  // });
  // if (!userSession) {
  //   return reject("Session not found");
  // }
  let user = await dbService.findOne(User, { _id: decodedData.id });
  req.user = user;
  next();
});

exports.authorizedRole = (...roles) => {
  return (req, res, next) => {
    console.log("🚀 ~ return ~ req:", req.user);
    if (!roles.includes(req.user.role)) {
      next(
        new ErrorHandler(
          `Role: ${req.user.role} is not authorized to perform this action`,
          403
        )
      );
    }
    next();
  };
};
