require('dotenv').config();

const express = require('express');
var cookies = require("cookie-parser");
const connectDB = require('./config/db');
const app = express();

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());
//Seed data
const seedPermissions = require('./seeder/permissionSetSeeder');
const seedUsers = require('./seeder/userMasterSeeder');

//Making async so we can use await for mongoose connection
(async () => {
    try {
        await connectDB();
        await seedPermissions();
        await seedUsers();
        app.use('/api/users', require('./routes/users'));
        app.listen(process.env.NODE_PORT, () => {
            console.log(`Server running at http://${process.env.MONGO_HOST}:${process.env.NODE_PORT}/`);
        })
    } catch (error) {
        console.log('MongoDB connection failed', error);
    }
})()
