const seedPermissions = require('./permissionSetSeeder');
const seedUsers = require('./userMasterSeeder');
const seedDivisions = require('./divisionSeeder');
const seedDepartments = require('./departmentSeeder');
const seedCategories = require('./categorySeeder');
const seedAssumptions = require('./assumptionSeeder');
const seedResources = require('./resourceSeeder');
const seedTechnologies = require('./technologySeeder');
const seedProductivities = require('./productivitySeeder');
const seedChecklists = require('./checklistSeeder');
const { updateDivisionLeads } = require('../controllers/divisionControllers');

const seedAllData = async () => {
    try {
        await seedPermissions();
        await seedDivisions();
        await seedUsers();
        await updateDivisionLeads();
        await seedDepartments();
        await seedCategories();
        await seedAssumptions();
        await seedResources();
        await seedTechnologies();
        await seedProductivities();
        await seedChecklists();
        console.log("Seeding completed successfully.");
    } catch (error) {
        console.log('Error during seeding:', error.message);
        throw error;
    }
};

module.exports = seedAllData;
