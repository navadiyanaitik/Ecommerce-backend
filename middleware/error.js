const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // wrong mongodb id error
    if (err.name === "CastError") {
        const messsage = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(messsage, 400)
    }

    // dublicate key error
    if (err.code === 11000) {
        const messsage = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(messsage, 500)
    }

    // Invalid jwt token

    if (err.name === "jsonWebTokenError") {
        const messsage = `Json Web Token is invalid, Try again`;
        err = new ErrorHandler(messsage, 400)
    }

    // Jwt Token Exprie Error

    if (err.name === "TokenExpireError") {
        const messsage = `Json Web Token is Expired, Try again`;
        err = new ErrorHandler(messsage, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}