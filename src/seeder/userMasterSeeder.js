const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserMaster = require('../models/userMaster');
const Division = require('../models/division');
const Department = require('../models/department');
const PermissionSet = require('../models/permissionSet');

const seedUsers = async () => {
    await UserMaster.deleteMany();

    const adminRole = await PermissionSet.findOne({ roleName: 'Admin' });
    const divisionLeadRole = await PermissionSet.findOne({ roleName: 'Division Lead' });
    const departmentLeadRole = await PermissionSet.findOne({ roleName: 'Department Lead' });
    const presaleDivisionRole = await PermissionSet.findOne({ roleName: 'Presale Division' });
    const presaleDepartmentRole = await PermissionSet.findOne({ roleName: 'Presale Department' });
    const opportunityRole = await PermissionSet.findOne({ roleName: 'Opportunity' });
    const employeeRole = await PermissionSet.findOne({ roleName: 'Employee' });

    const divisions = await Division.find();
    const departments = await Department.find();

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
        ...await Promise.all(departments.map(async (department, index) => ({
            username: `deptlead${index + 1}`,
            email: `deptlead${index + 1}@gmail.com`,
            displayName: `DeptLead${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: departmentLeadRole._id,
            department: department._id,
            division: department.division,
            profile: {
                fullName: `Department Lead ${index + 1}`,
                dateOfBirth: new Date(`198${index + 1}-03-20`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `091234567${index}`,
                location: department.name,
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(divisions.map(async (division, index) => ({
            username: `presaleDiv${index + 1}`,
            email: `presaleDiv${index + 1}@gmail.com`,
            displayName: `PresaleDiv${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: presaleDivisionRole._id,
            division: division._id,
            profile: {
                fullName: `Presale Division ${index + 1}`,
                dateOfBirth: new Date(`198${index + 1}-04-25`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `094567891${index}`,
                location: division.name,
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(departments.map(async (department, index) => ({
            username: `presaleDept${index + 1}`,
            email: `presaleDept${index + 1}@gmail.com`,
            displayName: `PresaleDept${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: presaleDepartmentRole._id,
            department: department._id,
            division: department.division,
            profile: {
                fullName: `Presale Department ${index + 1}`,
                dateOfBirth: new Date(`198${index + 1}-05-10`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `096789123${index}`,
                location: department.name,
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(Array.from({ length: 5 }, async (_, index) => ({
            username: `opportunity${index + 1}`,
            email: `opportunity${index + 1}@gmail.com`,
            displayName: `Opp${index + 1}`,
            password: await bcrypt.hash('password123', 10),
            role: opportunityRole._id,
            profile: {
                fullName: `Opportunity Lead ${index + 1}`,
                dateOfBirth: new Date(`199${index + 1}-06-15`),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                phoneNumber: `097890123${index}`,
                location: 'Opportunity Office',
            },
            lastLogin: new Date()
        }))),
        ...await Promise.all(Array.from({ length: 5 }, async (_, index) => ({
            username: `employee${index + 1}`,
            email: `employee${index + 1}@gmail.com`,
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
        })))
    ];

    await UserMaster.insertMany(users);
    console.log('Users created successfully');
};

module.exports = seedUsers;
