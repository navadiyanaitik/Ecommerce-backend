const express = require('express');
const dotenv = require('dotenv');
const app = express();
const logger = require('morgan');
const errorMiddleware = require('./middleware/error');
const cookieParser = require('cookie-parser');
const cors = require("cors");

dotenv.config({ path: '.env' });

// unhandled Promise Rejection

process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncought Exception.`);

    server.close(() => {
        process.exit(1);
    })
})

require('./config/dbConnection');
const corsOptions = { origin: process.env.ALLOW_ORIGIN };
app.use(cors(corsOptions));

const routes = require('./routes')
app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(routes);
app.use(errorMiddleware);





const server = app.listen(process.env.PORT, () => {
    console.log(`Server started at http://localhost:${process.env.PORT}`)
})

// unhandled Promise Rejection

process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection.`);

    server.close(() => {
        process.exit(1);
    })
})



