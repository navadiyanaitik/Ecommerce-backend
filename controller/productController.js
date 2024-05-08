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

exports.createProductReview = catchAsyncErrors(
    async (req, res, next) => {
        const { comment, rating, productId } = req.body;
        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        }
        const product = await Product.findById(productId);
        if (!product) {
            next(new ErrorHandler("Produnct now found", 400));
        }

        const isReviewed = product.reviews.some(item => {
            return req.user._id.toString() === item.user.toString()
        })

        if (isReviewed) {
            product.reviews.forEach(rev => {
                if (rev.user.toString() === req.user._id.toString()) {
                    rev.comment = comment;
                    rev.rating = rating;
                }
            });
        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }
        let totalRatings = 0;
        product.reviews.forEach(rev => totalRatings += Number(rev.rating));
        product.ratings = (totalRatings / product.reviews.length).toFixed(1);
        await product.save({ validateBeforeSave: false });

        res.status(201).json({ success: true, message: "review collected/updated successfully" });
    }
)

exports.getAllReviewsOfProduct = catchAsyncErrors(
    async (req, res, next) => {
        const id = req.query.id;
        const product = await dbService.findOne(Product, { _id: id });;
        if (!product) {
            next(new ErrorHandler("Product not found", 404));
        }
        res.status(200).json({ success: true, productReviews: product.reviews })
    }
)

exports.deleteProductReview = catchAsyncErrors(
    async (req, res, next) => {
        const id = req.query.id;
        const productId = req.query.productId;

        const product = await Product.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        const filteredReviews = product.reviews.filter(review => review._id.toString() !== id.toString());

        let totalRatings = 0;
        filteredReviews.forEach(rev => totalRatings += rev.rating);
        const ratings = (filteredReviews.length > 0) ? (totalRatings / filteredReviews.length).toFixed(1) : 0;
        const numOfReviews = filteredReviews.length;

        await Product.findByIdAndUpdate(productId, {
            reviews: filteredReviews,
            ratings,
            numOfReviews
        }, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        }
        );

        res.status(200).json({ success: true });
    }
);
