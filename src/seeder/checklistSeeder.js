const mongoose = require('mongoose');
const Checklist = require('../models/checklist');
const Category = require('../models/category');

const seedChecklists = async () => {
    try {
        await Checklist.deleteMany({});

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

        const checklistData = [
            { name: 'Deprecated APIs', subClass: 'Codebase', description: 'Identify and replace deprecated APIs.', priority: 'High', note: 'Critical for legacy systems.', category: categories[0]._id, assessment: 'High' },
            { name: 'Java 11 Feature Adoption', subClass: 'Codebase', description: 'Assess the adoption of new features in Java 11.', priority: 'Normal', note: 'Requires compatibility testing.', category: categories[0]._id, assessment: 'Medium' },
            { name: 'Testing Compatibility', subClass: 'Codebase', description: 'Evaluate the compatibility of existing test suites.', priority: 'High', note: 'Testing should cover all edge cases.', category: categories[0]._id, assessment: 'High' },
            { name: 'Security Vulnerability Assessment', subClass: 'Security', description: 'Assess security vulnerabilities in Java.', priority: 'Normal', note: 'Focus on SQL injection vulnerabilities.', category: categories[1]._id, assessment: 'Medium' },
            { name: 'Security Protocol Compatibility', subClass: 'Security', description: 'Ensure compatibility of security protocols.', priority: 'High', note: 'Check SSL and TLS versions.', category: categories[1]._id, assessment: 'High' },
            { name: 'Development Environment Compatibility', subClass: 'Codebase', description: 'Ensure smooth transition of development environments.', priority: 'Normal', note: 'Ensure Docker configuration is consistent.', category: categories[0]._id, assessment: 'Medium' },
            { name: 'Environment Configuration Management', subClass: 'Deployment', description: 'Implement environment configuration management.', priority: 'Normal', note: 'Configuration files must be version controlled.', category: categories[2]._id, assessment: 'Medium' },
            { name: 'System State Backup', subClass: 'Backup', description: 'Backup system state before migration.', priority: 'High', note: 'Ensure backups are encrypted.', category: categories[4]._id },
            { name: 'Resource Utilization Monitoring', subClass: 'Monitoring', description: 'Implement resource utilization monitoring.', priority: 'Normal', note: 'Monitor CPU and memory usage.', category: categories[3]._id }
        ];

        for (let checklistItem of checklistData) {
            const { name, subClass, description, priority, category, note } = checklistItem;

            const existingSubClasses = await Checklist.find({ category });

            let parentID = null;

            if (!existingSubClasses.length) {
                parentID = 1;
            } else {
                const existingSubClass = existingSubClasses.find(cl => cl.subClass === subClass);

                if (existingSubClass) {
                    parentID = existingSubClass.parentID;
                } else {
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
                parentID,
                note
            });

            await newChecklist.save();
        }

        console.log('Checklist data has been seeded successfully!');
    } catch (err) {
        console.error('Error seeding checklist data:', err.message);
    }
};

module.exports = seedChecklists;
