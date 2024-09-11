const seedPermissions = require('./permissionSetSeeder');
const seedUsers = require('./userMasterSeeder');
const seedDivisions = require('./divisionSeeder');
const seedDepartments = require('./departmentSeeder');
const seedCategories = require('./categorySeeder');
const seedAssumptions = require('./assumptionSeeder');
const { updateDivisionLeads } = require('../controllers/divisionControllers');

const seedAllData = async () => {
    try {
        // Seeder Data goes here
        await seedPermissions();
        await seedDivisions();
        await seedUsers();
        // Update division leads sau khi có dữ liệu
        await updateDivisionLeads();
        // Continue Seeder Data from here
        await seedDepartments();
        // Seed Category
        await seedCategories();
        // Seed Assumptions
        await seedAssumptions();
        console.log("Seeding completed successfully.");
    } catch (error) {
        console.log('Error during seeding:', error.message);
        throw error;
    }
};

module.exports = seedAllData;
