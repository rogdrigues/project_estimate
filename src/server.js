require('dotenv').config();

const express = require('express');
var cookies = require("cookie-parser");
const connectDB = require('./config/db');
const app = express();

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Set up middleware to log request time
app.use((req, res, next) => {
    console.log('Time:', Date.now());
    next();
});
//Adding cookie parser for reading req.cookies
app.use(cookies());
//Seed data
const seedPermissions = require('./seeder/permissionSetSeeder');
const seedUsers = require('./seeder/userMasterSeeder');

//Making async so we can use await for mongoose connection
(async () => {
    try {
        //Connect to MongoDB
        await connectDB();
        //Seeder Data goes here
        await seedPermissions();
        await seedUsers();
        //Routes
        app.use('/api/users', require('./routes/userRoutes'));

        app.listen(process.env.NODE_PORT, () => {
            console.log(`Server running at http://${process.env.MONGO_HOST}:${process.env.NODE_PORT}/`);
        })
    } catch (error) {
        console.log('MongoDB connection failed', error);
    }
})()
