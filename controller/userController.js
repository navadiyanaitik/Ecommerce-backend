const dbService = require('../utils/dbService');
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require('../middleware/catchAsyncError');
const User = require("../model/users");
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail.js');
const crypto = require('crypto');
const validation = require('../utils/validation/validateRequest.js')
const userKeys = require('../utils/validation/userValidation.js');


// Register user

exports.registerUser = catchAsyncErrors(
    async (req, res, next) => {
        const { name, email, password } = req.body;
        const isValidRequest = validation.validateParamsWithJoi(req.body, userKeys.registerUserSchemaKeys);
        if (!isValidRequest.isValid) {
            res.status(400).json({ success: false, message: 'Invalid Data, Validation Failed.' })
        }
        const user = await dbService.create(User, {
            name, email, password, avatar: {
                public_id: "this is sample Id",
                url: "profilepicurl"
            }
        })
        sendToken(user, 201, res);
    }
);

// Login user

exports.loginUser = catchAsyncErrors(
    async (req, res, next) => {
        const { email, password } = req.body;
        const isValidRequest = validation.validateParamsWithJoi(req.body, userKeys.loginSchemaKeys);
        if (!isValidRequest.isValid) {
            res.status(400).json({ success: false, message: 'Invalid Data, Validation Failed.' })
        }
        // if user has given password and email both
        if (!email || !password) {
            return next(new ErrorHandler("Please enter Email & Password", 400));
        }

        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        sendToken(user, 200, res);
    }
)

// Logout User

exports.logoutUser = catchAsyncErrors(
    async (req, res, next) => {
        res.cookie('token', null, {
            expires: new Date(Date.now()),
            httpOnly: true
        })
        res.status(200).json({ success: true, message: "Logged Out Successfully" })
    }
)

// Forgot password

exports.forgotPassword = catchAsyncErrors(
    async (req, res, next) => {
        // const isValidRequest = validation.validateParamsWithJoi(req.body.email, userKeys.forgotPasswordSchemaKeys);
        // if (!isValidRequest.isValid) {
        //     return next(new ErrorHandler(isValidRequest.message, 400));
        // }
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return next(new ErrorHandler('user not found', 404));
        }

        // Get resetPassword token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/password/reset/${resetToken}`;

        console.log("🚀 ~ resetPasswordUrl:", resetPasswordUrl)
        const message = `Your password reset token is \n \n ${resetPasswordUrl} \n \n If you have not requested than ignore it`;

        try {
            await sendEmail({
                email: user.email,
                subject: `Ecommerce Password Recovery`,
                message
            })

            return res.status(200).json({ success: true, message: `Email sent to ${user.email} successfully` })
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return next(new ErrorHandler(error.message, 500))

        }
    }
)

// Reset password

exports.resetPassword = catchAsyncErrors(
    async (req, res, next) => {
        const isValidRequest = validation.validateParamsWithJoi(req.body, userKeys.resetPasswordSchemaKeys);
        if (!isValidRequest.isValid) {
            res.status(400).json({ success: false, message: isValidRequest.message });
            return next(new ErrorHandler(isValidRequest.message, 400));
        }
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest('hex');
        const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });

        if (!user) {
            return next(new ErrorHandler("Reset password token is invalid or has been expired", 400));
        }

        if (req.body.password != req.body.confirmPassword) {
            return next(new ErrorHandler("password does not match", 400));
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        sendToken(user, 200, res);
    }
)

// Delete User

exports.deleteUser = catchAsyncErrors(
    async (req, res, next) => {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            next(new ErrorHandler(`User not found with ID:${req.params.id}`, 400));
        }

        await user.deleteOne();
        res.status(200).json({ success: true, message: "user deleted successfully" });
    }
)

// Get all users

exports.getAllUsers = catchAsyncErrors(
    async (req, res, next) => {
        const users = await dbService.findMany(User);
        if (!users) {
            return next(new ErrorHandler("Users not found", 400));
        }
        res.status(200).json({ success: true, users })
    }
)

// get profile

exports.getProfile = catchAsyncErrors(
    async (req, res, next) => {
        const user = await dbService.findOne(User, { _id: req.user._id }, { password: 0 });
        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }
        res.status(200).json({ success: true, user })
    }
)

// update user role

exports.updateRole = catchAsyncErrors(
    async (req, res, next) => {
        const id = req.params.id;
        const user = await User.findById(id);
        console.log("🚀 ~ user:", user)
        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }
        user.role = req.body.role;
        await user.save();
        res.status(201).json({ success: true, message: "user role updated successfully" });

    }
)

// Update Profile

exports.updateProfile = catchAsyncErrors(
    async (req, res, next) => {
        const { email, name } = req.body;
        const payload = {
            email,
            name
        };

        if (!email || !name) {
            return next(new ErrorHandler("email or name is not provided", 400));
        }

        const user = await dbService.updateOne(User, { _id: req.user._id }, { $set: payload });
        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }
        res.status(200).json({ success: true })
    }
);

// Update Role

exports.newPassword = catchAsyncErrors(
    async (req, res, next) => {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById({ _id: req.user._id });
        if (!user) {
            next(new ErrorHandler("User not found", 400));
        }

        if (newPassword !== confirmPassword) {
            next(new ErrorHandler("password does not match", 400));
        }

        const isPasswordMatched = await user.comparePassword(oldPassword);
        if (isPasswordMatched) {
            user.password = newPassword;
            await user.save();

            res.status(201).json({ success: true, message: "Your password updated successfully" })
        } else {
            next(new ErrorHandler("your old password does not match", 400))
        }
    }
)