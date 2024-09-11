const mongoose = require('mongoose');
const Assumption = require('../models/assumption');
const Project = require('../models/project');
const Category = require('../models/category');

const seedAssumptions = async () => {
    try {
        await Assumption.deleteMany();

        //const projects = await Project.find();  
        const categories = await Category.find();

        const assumptions = [
            {
                //project: projects[0]._id, 
                title: 'Budget Estimate',
                content: 'The project will remain within the given budget throughout the duration.',
                category: categories[0]._id,
            },
            {
                // project: projects[1]._id,
                title: 'Timeline Assumption',
                content: 'The project timeline will not exceed the planned deadlines.',
                category: categories[1]._id,
            },
            {
                // project: projects[2]._id,
                title: 'Resource Allocation',
                content: 'Sufficient resources will be available throughout the project.',
                category: categories[2]._id,
            },
            {
                //project: projects[3]._id,
                title: 'Technology Stack Stability',
                content: 'The technology stack chosen will remain stable and will not change during the project.',
                category: categories[3]._id,
            },
            {
                //project: projects[4]._id,
                title: 'Client Requirements',
                content: 'All client requirements have been clearly defined and will not change.',
                category: categories[4]._id,
            },
            {
                //project: projects[0]._id,
                title: 'Team Availability',
                content: 'The project team will be available and will not experience unexpected absences.',
                category: categories[5]._id,
            },
            {
                //project: projects[1]._id,
                title: 'Vendor Support',
                content: 'All third-party vendors will provide full support throughout the project.',
                category: categories[1]._id,
            },
            {
                //project: projects[2]._id,
                title: 'Data Security',
                content: 'All sensitive data will be stored and managed in accordance with security protocols.',
                category: categories[0]._id,
            }
        ];

        await Assumption.insertMany(assumptions);
        console.log('Assumptions seeded successfully!');
    } catch (err) {
        console.error('Error while seeding assumptions:', err.message);
    }
};

module.exports = seedAssumptions;
