const mongoose = require('mongoose');
const Checklist = require('../models/checklist');
const Category = require('../models/category');

const seedChecklists = async () => {
    try {
        await Checklist.deleteMany({});

        // Lấy dữ liệu Category từ database
        let categoryNames = ['Codebase', 'Security', 'Deployment', 'Monitoring', 'Backup'];
        let categories = [];

        for (let categoryName of categoryNames) {
            let category = await Category.findOne({ CategoryName: categoryName });
            if (!category) {
                category = new Category({ CategoryName: categoryName, SubCategory: 'N/A' });
                await category.save();
            }
            categories.push(category);
        }

        // Dữ liệu fake cho Checklist
        const checklistData = [
            { name: 'Deprecated APIs', subClass: 'Codebase', description: 'Identify and replace deprecated APIs.', priority: 'High', category: categories[0]._id },
            { name: 'Java 11 Feature Adoption', subClass: 'Codebase', description: 'Assess the adoption of new features in Java 11.', priority: 'Medium', category: categories[0]._id },
            { name: 'Testing Compatibility', subClass: 'Codebase', description: 'Evaluate the compatibility of existing test suites.', priority: 'High', category: categories[0]._id },
            { name: 'Security Vulnerability Assessment', subClass: 'Security', description: 'Assess security vulnerabilities in Java.', priority: 'Medium', category: categories[1]._id },
            { name: 'Security Protocol Compatibility', subClass: 'Codebase', description: 'Ensure compatibility of security protocols.', priority: 'High', category: categories[1]._id },
            { name: 'Development Environment Compatibility', subClass: 'Codebase', description: 'Ensure smooth transition of development environments.', priority: 'Medium', category: categories[0]._id },
            { name: 'Environment Configuration Management', subClass: 'Deployment', description: 'Implement environment configuration management.', priority: 'Medium', category: categories[2]._id },
            { name: 'System State Backup', subClass: 'Backup', description: 'Backup system state before migration.', priority: 'High', category: categories[4]._id },
            { name: 'Resource Utilization Monitoring', subClass: 'Monitoring', description: 'Implement resource utilization monitoring.', priority: 'Medium', category: categories[3]._id }
        ];

        for (let checklistItem of checklistData) {
            const { name, subClass, description, priority, category } = checklistItem;

            // Kiểm tra các checklist đã tồn tại cùng Category và SubClass
            const existingSubClasses = await Checklist.find({ category });

            let parentID = null;

            if (!existingSubClasses.length) {
                // Nếu chưa có checklist nào trong Category, parentID bắt đầu từ 1
                parentID = 1;
            } else {
                const existingSubClass = existingSubClasses.find(cl => cl.subClass === subClass);

                if (existingSubClass) {
                    // SubClass đã tồn tại, sử dụng parentID cũ
                    parentID = existingSubClass.parentID;
                } else {
                    // SubClass chưa tồn tại, tạo parentID mới
                    const maxParentId = Math.max(...existingSubClasses.map(cl => cl.parentID));
                    parentID = maxParentId + 1;
                }
            }

            const newChecklist = new Checklist({
                name,
                subClass,
                description,
                category,
                priority,
                parentID
            });

            await newChecklist.save();
        }

        console.log('Checklist data has been seeded successfully!');
    } catch (err) {
        console.error('Error seeding checklist data:', err.message);
    }
};

module.exports = seedChecklists;
