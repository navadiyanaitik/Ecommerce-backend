const express = require('express');
const dotenv = require('dotenv');
const app = express();
const logger = require('morgan');
const errorMiddleware = require('./middleware/error');
const cookieParser = require('cookie-parser');

// unhandled Promise Rejection

process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncought Exception.`);

    server.close(() => {
        process.exit(1);
    })
})

dotenv.config({ path: '.env' });

require('./config/dbConnection');

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



