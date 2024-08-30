const mongoose = require('mongoose');
const Department = require('../models/department');
const UserMaster = require('../models/userMaster');
const Division = require('../models/division');

const seedDepartments = async () => {
    await Department.deleteMany(); // Xóa tất cả dữ liệu cũ để tránh trùng lặp

    // Tìm tất cả người dùng có vai trò là Department Lead
    const departmentLeadRole = await UserMaster.find()
        .populate('role');

    // Lọc ra những người dùng có roleName là 'Department Lead'
    const departmentLeads = departmentLeadRole.filter(user => user.role && user.role.roleName === 'Department Lead');

    const divisions = await Division.find();

    const departments = [];

    divisions.forEach((division, index) => {
        // Giả sử mỗi Division sẽ có một Department Lead khác nhau
        const lead = departmentLeads[index % departmentLeads.length];

        departments.push(
            {
                code: `HRD-Dept${index + 1}`,
                name: `HR Department ${index + 1}`,
                division: division._id,
                lead: lead._id,
                description: `This is HR Department ${index + 1}`
            },
            {
                code: `ITD-Dept${index + 1}`,
                name: `IT Department ${index + 1}`,
                division: division._id,
                lead: lead._id,
                description: `This is IT Department ${index + 1}`
            },
            {
                code: `FND-Dept${index + 1}`,
                name: `Finance Department ${index + 1}`,
                division: division._id,
                lead: lead._id,
                description: `This is Finance Department ${index + 1}`
            }
        );
    });

    await Department.insertMany(departments);
    console.log('Departments created successfully');
};

module.exports = seedDepartments;
