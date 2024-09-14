const Resource = require('../models/resource');

const seedResources = async () => {
    try {
        // Clear all existing resources
        await Resource.deleteMany({});

        // Create fake data for resources
        const resources = [
            {
                name: 'Tech Lead',
                unitPrice: 5000,
                location: 'Japan',
                level: 'Senior',
                currency: 'JPY',
                conversionRate: 0.0091,  // Conversion rate to USD
            },
            {
                name: 'Frontend Developer',
                unitPrice: 3000,
                location: 'Vietnam',
                level: 'Mid',
                currency: 'VND',
                conversionRate: 0.000042,  // Conversion rate to USD
            },
            {
                name: 'Backend Developer',
                unitPrice: 3500,
                location: 'USA',
                level: 'Senior',
                currency: 'USD',
                conversionRate: 1,  // USD as base currency
            },
            {
                name: 'Data Scientist',
                unitPrice: 6000,
                location: 'Germany',
                level: 'Senior',
                currency: 'EUR',
                conversionRate: 1.1,  // Conversion rate to USD
            },
            {
                name: 'Project Manager',
                unitPrice: 4500,
                location: 'India',
                level: 'Mid',
                currency: 'INR',
                conversionRate: 0.012,  // Conversion rate to USD
            },
            {
                name: 'UI/UX Designer',
                unitPrice: 2800,
                location: 'Canada',
                level: 'Junior',
                currency: 'CAD',
                conversionRate: 0.78,  // Conversion rate to USD
            },
        ];

        // Insert the fake resources data
        await Resource.insertMany(resources);
        console.log('Resources seeded successfully');
    } catch (err) {
        console.error('Error while seeding resources:', err.message);
    }
};

module.exports = seedResources;
