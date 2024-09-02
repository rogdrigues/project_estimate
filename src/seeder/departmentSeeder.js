const mongoose = require('mongoose');
const Department = require('../models/department');
const UserMaster = require('../models/userMaster');
const Division = require('../models/division');

const seedDepartments = async () => {
    try {
        await Department.deleteMany();
        const departmentLeadRole = await UserMaster.find()
            .populate('role');

        const departmentLeads = departmentLeadRole.filter(user => user.role && user.role.roleName === 'Department Lead');

        const divisions = await Division.find();

        const departments = [];

        divisions.forEach((division, index) => {
            const lead = departmentLeads[index % departmentLeads.length];

            departments.push(
                {
                    code: `HRD-H${index + 1}`,
                    name: `HR Department ${index + 1}`,
                    division: division._id,
                    lead: lead._id,
                    description: `This is HR Department ${index + 1}`
                },
                {
                    code: `ITD-K${index + 1}`,
                    name: `IT Department ${index + 1}`,
                    division: division._id,
                    lead: lead._id,
                    description: `This is IT Department ${index + 1}`
                },
                {
                    code: `FND-Z${index + 1}`,
                    name: `Finance Department ${index + 1}`,
                    division: division._id,
                    lead: lead._id,
                    description: `This is Finance Department ${index + 1}`
                }
            );
        });

        const createdDepartments = await Department.insertMany(departments);

        for (let i = 0; i < createdDepartments.length; i++) {
            const lead = departmentLeads[i % departmentLeads.length];
            lead.department = createdDepartments[i]._id;
            await lead.save();
        }
        console.log('Department leads updated successfully');
    } catch (err) {
        console.error('Error while creating departments:', err.message);
    }
};

module.exports = seedDepartments;
