const mongoose = require('mongoose');
const Technology = require('../models/technology');

const seedTechnologies = async () => {
    try {
        await Technology.deleteMany({});

        const technologies = [
            {
                name: 'React',
                version: '18.0.0',
                category: 'Frontend',
                standard: 'A JavaScript library for building user interfaces'
            },
            {
                name: 'Node.js',
                version: '16.13.0',
                category: 'Backend',
                standard: 'A JavaScript runtime built on Chrome\'s V8 JavaScript engine'
            },
            {
                name: 'MongoDB',
                version: '5.0',
                category: 'Database',
                standard: 'A document-oriented NoSQL database'
            },
            {
                name: 'Docker',
                version: '20.10',
                category: 'DevOps',
                standard: 'A platform for developing, shipping, and running applications'
            },
            {
                name: 'TypeScript',
                version: '4.5.2',
                category: 'Language',
                standard: 'A strongly typed programming language that builds on JavaScript'
            },
            {
                name: 'Kubernetes',
                version: '1.22',
                category: 'DevOps',
                standard: 'An open-source system for automating deployment, scaling, and management of containerized applications'
            },
            {
                name: 'PostgreSQL',
                version: '13',
                category: 'Database',
                standard: 'A powerful, open-source object-relational database system'
            },
            {
                name: 'Angular',
                version: '12',
                category: 'Frontend',
                standard: 'A platform for building mobile and desktop web applications'
            },
            {
                name: 'Java',
                version: '17',
                category: 'Language',
                standard: 'A high-level, class-based, object-oriented programming language'
            },
            {
                name: 'MySQL',
                version: '8.0',
                category: 'Database',
                standard: 'A widely used open-source relational database management system'
            }
        ];

        await Technology.insertMany(technologies);
        console.log('Technologies created successfully');
    } catch (err) {
        console.error('Error while creating technologies:', err.message);
    }
};

module.exports = seedTechnologies;
