
const Division = require('../models/division');

const seedDivisions = async () => {
    try {
        await Division.deleteMany({});

        const divisions = [
            { code: 'HRD', name: 'Human Resources Division', description: 'This is the HR Division' },
            { code: 'ITD', name: 'Information Technology Division', description: 'This is the IT Division' },
            { code: 'FND', name: 'Finance Division', description: 'This is the Finance Division' },
            { code: 'MRK', name: 'Marketing Division', description: 'This is the Marketing Division' },
            { code: 'OPD', name: 'Operations Division', description: 'This is the Operations Division' },
            { code: 'PRD', name: 'Product Division', description: 'This is the Product Division' }
        ];

        await Division.insertMany(divisions);
        console.log('Divisions created successfully');
    } catch (err) {
        console.error('Error while creating divisions:', err.message);
    }
};

module.exports = seedDivisions;