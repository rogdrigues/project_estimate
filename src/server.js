require('dotenv').config();
const connectDB = require('./config/db');
const express = require('express');
const app = express();
const useMiddlewares = require('./middlewares/middleware');

// Call middleware.js
useMiddlewares(app, express);
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
