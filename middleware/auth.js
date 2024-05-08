const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');
const User = require("../model/users");
const dbService = require('../utils/dbService');

exports.isAuthenticated = catchAsyncError(
    async (req, res, next) => {
        let { token } = req.cookies;
        if (!token) {
            next(new ErrorHandler("Please login to access this resource", 401));
        }
        let decodedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await dbService.findOne(User, { _id: decodedData.id });
        next();
    }
)

exports.authorizedRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            next(new ErrorHandler(`Role: ${req.user.role} is not authorized to perform this action`, 403))
        }
        next()
    }

}   