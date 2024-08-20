
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserMaster = require('../models/userMaster');
const PermissionSet = require('../models/permissionSet');
const connectDB = require('../config/db');

const seedUsers = async () => {
    try {
        await UserMaster.deleteMany({});
        const adminRole = await PermissionSet.findOne({ roleName: 'Admin' });
        const divisionLeadRole = await PermissionSet.findOne({ roleName: 'Division Lead' });
        const departmentLeadRole = await PermissionSet.findOne({ roleName: 'Department Lead' });
        const projectManagerRole = await PermissionSet.findOne({ roleName: 'Project Manager' });
        const reviewerRole = await PermissionSet.findOne({ roleName: 'Reviewer' });
        const employeeRole = await PermissionSet.findOne({ roleName: 'Employee' });
        const customerRole = await PermissionSet.findOne({ roleName: 'Customer' });

        const users = [
            {
                username: 'admin',
                email: 'admin@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: adminRole._id,
                profile: {
                    fullName: 'Admin User',
                    dateOfBirth: new Date('1985-10-15'),
                    gender: 'Male',
                    phoneNumber: '1234567890',
                    location: 'Admin City',
                },
                lastLogin: new Date(),
            },
            {
                username: 'division_lead',
                email: 'division_lead@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: divisionLeadRole._id,
                profile: {
                    fullName: 'Division Lead User',
                    dateOfBirth: new Date('1980-09-25'),
                    gender: 'Female',
                    phoneNumber: '1234509876',
                    location: 'Division City',
                },
                lastLogin: new Date(),
            },
            {
                username: 'department_lead',
                email: 'department_lead@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: departmentLeadRole._id,
                profile: {
                    fullName: 'Department Lead User',
                    dateOfBirth: new Date('1975-11-30'),
                    gender: 'Male',
                    phoneNumber: '0987654321',
                    location: 'Department City',
                },
                lastLogin: new Date(),
            },
            {
                username: 'project_manager',
                email: 'project_manager@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: projectManagerRole._id,
                profile: {
                    fullName: 'Project Manager User',
                    dateOfBirth: new Date('1982-07-10'),
                    gender: 'Other',
                    phoneNumber: '1122334455',
                    location: 'Project City',
                },
                lastLogin: new Date(),
            },
            {
                username: 'reviewer',
                email: 'reviewer@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: reviewerRole._id,
                profile: {
                    fullName: 'Reviewer User',
                    dateOfBirth: new Date('1992-02-20'),
                    gender: 'Female',
                    phoneNumber: '2233445566',
                    location: 'Reviewer Town',
                },
                lastLogin: new Date(),
            },
            {
                username: 'employee',
                email: 'employee@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: employeeRole._id,
                profile: {
                    fullName: 'Employee User',
                    dateOfBirth: new Date('1995-08-15'),
                    gender: 'Male',
                    phoneNumber: '3344556677',
                    location: 'Employee Village',
                },
                lastLogin: new Date(),
            },
            {
                username: 'customer',
                email: 'customer@gmail.com',
                password: await bcrypt.hash('password123', 10),
                role: customerRole._id,
                profile: {
                    fullName: 'Customer User',
                    dateOfBirth: new Date('1988-06-05'),
                    gender: 'Male',
                    phoneNumber: '4455667788',
                    location: 'Customer Town',
                },
                lastLogin: new Date(),
            },
        ];

        await UserMaster.insertMany(users);
        console.log('Fake users created successfully!');
    } catch (err) {
        console.error('Error while creating users:', err.message);
    }
};

module.exports = seedUsers;
