require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');

const app = express();

//Middleware
app.use(express.json());

//Making async so we can use await for mongoose connection
(async () => {
    try {
        await connectDB();

        app.listen(process.env.NODE_PORT, () => {
            console.log(`Server running at http://${process.env.MONGO_HOST}:${process.env.NODE_PORT}/`);
        })
    } catch (error) {
        console.log('MongoDB connection failed', error);
    }
})()
