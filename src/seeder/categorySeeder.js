const mongoose = require('mongoose');
const Category = require('../models/category');

const seedCategories = async () => {
    try {
        await Category.deleteMany({});

        const categories = [
            { CategoryName: 'Migration', SubCategory: 'An IT migration is the shifting of data or software from one system to another.' },
            { CategoryName: 'Low Code', SubCategory: 'A powerful approach to software development with minimal hand-coding.' },
            { CategoryName: 'Maintenance', SubCategory: 'Project that maintains existing areas and facilities through repairs.' },
            { CategoryName: 'Quality Assurance', SubCategory: 'Projects related to testing and quality control of products.' },
            { CategoryName: 'Research and Development', SubCategory: 'Projects for researching and developing new technologies.' },
            { CategoryName: 'Software Development', SubCategory: 'Projects related to the development of software applications.' },
        ];

        await Category.insertMany(categories);
        console.log('Categories created successfully!');
    } catch (err) {
        console.error('Error while creating categories:', err.message);
    }
};

module.exports = seedCategories;
