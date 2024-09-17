const mongoose = require('mongoose');
const Productivity = require('../models/productivity');
const Technology = require('../models/technology');

const seedProductivity = async () => {
    try {
        await Productivity.deleteMany();

        const technologies = await Technology.find();
        const productivityData = [
            { technology: 'TypeScript', productivity: 85, norm: 'Division', unit: 'StoryPoint' },
            { technology: 'TypeScript', productivity: 80, norm: 'Division', unit: 'LOC' },
            { technology: 'PHP', productivity: 75, norm: 'Department', unit: 'LOC' },
            { technology: 'PHP', productivity: 90, norm: 'Department', unit: 'Screen' },
            { technology: 'Kotlin', productivity: 85, norm: 'Other', unit: 'StoryPoint' },
            { technology: 'Swift', productivity: 88, norm: 'Other', unit: 'Screen' },
            { technology: 'Go', productivity: 82, norm: 'Division', unit: 'LOC' },
            { technology: 'Go', productivity: 79, norm: 'Other', unit: 'StoryPoint' },
            { technology: 'JavaScript', productivity: 85, norm: 'Division', unit: 'StoryPoint' },
            { technology: 'JavaScript', productivity: 70, norm: 'Department', unit: 'LOC' },
        ];

        const finalData = productivityData.map(item => {
            const tech = technologies.find(tech => tech.name === item.technology);
            return {
                productivity: item.productivity,
                technology: tech ? tech._id : null,
                norm: item.norm,
                unit: item.unit,
            };
        });

        await Productivity.insertMany(finalData);

        console.log('Productivity data seeded successfully');
    } catch (err) {
        console.error('Error seeding productivity data:', err.message);
    }
};

module.exports = seedProductivity;
