const Product = require("../model/product");
const dbService = require('../utils/dbService');
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require('../middleware/catchAsyncError');
const ApiFeatures = require("../utils/apiFeatures");


exports.getAllProducts = catchAsyncErrors(
    async (req, res, next) => {
        let resultPerPage = 5;
        const apiFeature = new ApiFeatures(Product.find().sort({ createdAt: -1, updatedAt: -1 }), req.query).search().filter().pagination(resultPerPage);
        const products = await apiFeature.query;
        return res.status(200).json({ success: true, products });
    }
);

exports.getProduct = catchAsyncErrors(
    async (req, res, next) => {
        const id = req.params.id;
        const product = await dbService.findOne(Product, { _id: id });
        if (!product) {
            return next(new ErrorHandler("Product not found!"));
        }
        return res.status(200).json({ success: true, product });
    }
)

exports.createProduct = catchAsyncErrors(
    async (req, res, next) => {
        req.body.addedBy = await req.user._id;
        const data = req.body;
        const result = await dbService.create(Product, data);
        return res.status(201).json({
            success: true,
            result
        })
    }
);

exports.deleteProduct = catchAsyncErrors(
    async (req, res, next) => {
        const id = req.params.id;
        const result = await dbService.deleteOne(Product, { _id: id });
        if (!result) {
            return next(new ErrorHandler("Product not found!"));
        }
        return res.status(201).json({ success: true, result });
    }
)

exports.updateProduct = catchAsyncErrors(
    async (req, res, next) => {
        try {
            const id = req.params.id;
            const result = await dbService.updateOne(Product, { _id: id }, { $set: req.body });
            if (!result) {
                return next(new ErrorHandler("Product not found!"));
            }
            return res.status(201).json({
                success: true,
                result
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error
            })
        }
    }
)