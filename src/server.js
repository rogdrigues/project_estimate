require('dotenv').config();

const express = require('express');
const cookies = require("cookie-parser");
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();

//Set up cors
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
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
const seedDivisions = require('./seeder/divisionSeeder');
const seedDepartments = require('./seeder/departmentSeeder');
//Controller
const { updateDivisionLeads } = require('./controllers/divisionControllers');
//Making async so we can use await for mongoose connection
(async () => {
    try {
        //Connect to MongoDB
        await connectDB();
        //Seeder Data goes here
        await seedPermissions();
        await seedDivisions();
        await seedUsers();
        //Update division leads
        await updateDivisionLeads();
        //Continue Seeder Data from here
        await seedDepartments();
        //End Seeder Data
        //Routes
        app.use('/api/users', require('./routes/userRoutes'));
        app.use('/api/division', require('./routes/divisionRoutes'));
        app.use('/api/department', require('./routes/departmentRoutes'));
        app.listen(process.env.NODE_PORT, () => {
            console.log(`Server running at http://${process.env.MONGO_HOST}:${process.env.NODE_PORT}/`);
        })
    } catch (error) {
        console.log('MongoDB connection failed', error);
    }
})()
