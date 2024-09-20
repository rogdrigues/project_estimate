const PermissionSet = require('../models/permissionSet');

const seedPermissions = async () => {
    try {
        await PermissionSet.deleteMany({});
        const roles = [
            {
                roleName: 'Admin',
                permissions:
                    [
                        'manage_system',
                        'view_projects',
                        'view_dashboard',
                        'manage_users',
                        'manage_department',
                        'manage_division',
                        'manage_categories',
                        'manage_assumptions',
                        'manage_checklists',
                        'manage_technology',
                        'manage_resources',
                        'manage_productivity',
                        'manage_template'
                    ]
            },
            {
                roleName: 'Division Lead',
                permissions:
                    [
                        'project_review', // Allows reviewing when someone sends a project for review from an opportunity perspective
                        'view_division_profile',
                        'view_projects',
                        'manage_resources',
                        'manage_assumptions',
                        'manage_checklists',
                        'manage_technology',
                        'manage_productivity',
                        'view_template',
                        'view_dashboard',
                        'view_userprofile',
                        'manage_users', // Can only manage users in their division and the departments under their division
                        'manage_division', // Can only manage their division
                        'manage_categories',
                        'manage_own_department' // Can only manage their own department
                    ]
            },
            {
                roleName: 'Department Lead',
                permissions:
                    [
                        'project_review', // Allows reviewing when someone sends a project for review from an opportunity perspective
                        'view_department_profile', // Can only view their department they are working in
                        'view_projects',
                        'manage_resources',
                        'manage_assumptions',
                        'manage_checklists',
                        'manage_technology',
                        'manage_productivity',
                        'view_template',
                        'view_dashboard',
                        'view_userprofile',
                        'manage_users', // Can only manage users in their department
                        'view_department', // Can only view their department they are working in
                        'manage_categories'
                    ]
            },
            {
                roleName: 'Opportunity',
                permissions: [
                    'view_opportunity', // Can only view opportunities they are working on or had been assigned to
                    'manage_projects',
                    'manage_categories',
                    'manage_assumptions',
                    'manage_checklists',
                    'manage_technology',
                    'manage_resources',
                    'manage_productivity',
                    'manage_template',
                    'view_userprofile'
                ]
            },
            {
                roleName: 'Presale Division',
                permissions: [
                    'manage_presale_plan',
                    'manage_opportunity',
                    'view_projects',
                    'project_review', // Allows reviewing when someone sends a project for review from an opportunity perspective
                    'view_dashboard',
                    'manage_resources',
                    'manage_categories',
                    'manage_assumptions',
                    'manage_checklists',
                    'manage_technology',
                    'view_template',
                    'view_division_profile',
                    'view_userprofile'
                ]
            },
            {
                roleName: 'Presale Department',
                permissions: [
                    'manage_presale_plan',
                    'manage_opportunity',
                    'view_projects',
                    'project_review',
                    'view_dashboard',
                    'manage_resources',
                    'manage_categories',
                    'manage_assumptions',
                    'manage_checklists',
                    'manage_technology',
                    'view_template',
                    'view_department_profile',
                    'view_userprofile'
                ]
            },
            {
                roleName: 'Employee',
                permissions: [
                    'view_projects',
                    'view_categories',
                    'view_dashboard',
                    'view_userprofile',
                    'view_productivity',
                    'view_checklists',
                    'view_assumptions',
                    'view_resources',
                    'view_technology',
                    'view_opportunity'
                ]
            }
        ];

        await PermissionSet.insertMany(roles);
        console.log('Permission sets created successfully!');
    } catch (err) {
        console.error('Error while creating permission sets:', err.message);
    }
};

module.exports = seedPermissions;
