const dbService = require('../utils/dbService');
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require('../middleware/catchAsyncError');
const User = require("../model/users");
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail.js');
const crypto = require('crypto');


// Register user

exports.registerUser = catchAsyncErrors(
    async (req, res, next) => {
        const { name, email, password } = req.body;
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

// forgot password

exports.forgotPassword = catchAsyncErrors(
    async (req, res, next) => {
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

// reset password

exports.resetPassword = catchAsyncErrors(
    async (req, res, next) => {
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