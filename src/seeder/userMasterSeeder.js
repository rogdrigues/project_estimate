const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserMaster = require('../models/userMaster');
const Division = require('../models/division');
const PermissionSet = require('../models/permissionSet');
const connectDB = require('../config/db');

const seedUsers = async () => {
    await UserMaster.deleteMany();

    const adminRole = await PermissionSet.findOne({ roleName: 'Admin' });
    const divisionLeadRole = await PermissionSet.findOne({ roleName: 'Division Lead' });
    const departmentLeadRole = await PermissionSet.findOne({ roleName: 'Department Lead' });
    const projectManagerRole = await PermissionSet.findOne({ roleName: 'Project Manager' });
    const reviewerRole = await PermissionSet.findOne({ roleName: 'Reviewer' });
    const employeeRole = await PermissionSet.findOne({ roleName: 'Employee' });
    const customerRole = await PermissionSet.findOne({ roleName: 'Customer' });

    const divisions = await Division.find();

    const users = [
        {
            username: 'admin',
            email: 'admin@gmail.com',
            displayName: 'AdminU',
            password: await bcrypt.hash('password123', 10),
            role: adminRole._id,
            profile: {
                fullName: 'Admin User',
                dateOfBirth: new Date('1980-01-01'),
                gender: 'Male',
                phoneNumber: '0123456789',
                location: 'Head Office',
            },
            lastLogin: new Date()
        },
        ...await Promise.all(divisions.map(async (division, index) => ({
            username: `divlead${index + 1}`,
            email: `divlead${index + 1}@gmail.com`,
            displayName: `DivLead${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: divisionLeadRole._id,
            division: division._id,
            profile: {
                fullName: `Division Lead ${index + 1}`,
                dateOfBirth: new Date(`197${index + 1}-02-15`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `098765432${index}`,
                location: division.name,
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(Array.from({ length: 5 }, async (_, index) => ({
            username: `deptlead${index + 1}`,
            email: `deptlead${index + 1}@gmail.com`,
            displayName: `DeptLead${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: departmentLeadRole._id,
            profile: {
                fullName: `Department Lead ${index + 1}`,
                dateOfBirth: new Date(`198${index + 1}-03-20`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `091234567${index}`,
                location: 'Department Office',
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(Array.from({ length: 5 }, async (_, index) => ({
            username: `projmanager${index + 1}`,
            email: `projmanager${index + 1}@gmail.com`,
            displayName: `ProjManager${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: projectManagerRole._id,
            profile: {
                fullName: `Project Manager ${index + 1}`,
                dateOfBirth: new Date(`198${index + 1}-04-25`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `094567891${index}`,
                location: 'Project Office',
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(Array.from({ length: 5 }, async (_, index) => ({
            username: `user${index + 1}`,
            email: `user${index + 1}@gmail.com`,
            displayName: `Emp${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: employeeRole._id,
            profile: {
                fullName: `Employee ${index + 1}`,
                dateOfBirth: new Date(`199${index + 1}-05-10`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `096789123${index}`,
                location: 'General Office',
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(Array.from({ length: 5 }, async (_, index) => ({
            username: `customer${index + 1}`,
            email: `customer${index + 1}@gmail.com`,
            displayName: `Cust${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: customerRole._id,
            profile: {
                fullName: `Customer ${index + 1}`,
                dateOfBirth: new Date(`199${index + 2}-06-15`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `097890123${index}`,
                location: 'Customer Location',
            },
            lastLogin: new Date()
        }))),
    ];

    await UserMaster.insertMany(users);
    console.log('Users created successfully');
};

module.exports = seedUsers;