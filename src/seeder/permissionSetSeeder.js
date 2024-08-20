// seeder/permissionSetSeeder.js

const PermissionSet = require('../models/permissionSet');

const seedPermissions = async () => {
    try {
        await PermissionSet.deleteMany({});
        const roles = [
            { roleName: 'Admin', permissions: ['manage_system', 'manage_users', 'manage_projects', 'manage_resources'] },
            { roleName: 'Division Lead', permissions: ['assign_projects', 'manage_division_resources', 'approve_projects'] },
            { roleName: 'Department Lead', permissions: ['manage_department_projects', 'approve_changes', 'manage_department_resources'] },
            { roleName: 'Project Manager', permissions: ['manage_project', 'assign_tasks', 'track_progress'] },
            { roleName: 'Reviewer', permissions: ['review_projects', 'provide_feedback', 'request_changes'] },
            { roleName: 'Employee', permissions: ['view_assigned_projects', 'update_task_status', 'submit_reports'] },
            { roleName: 'Customer', permissions: ['view_projects', 'submit_feedback'] },
            { roleName: 'Guest', permissions: ['view_public_information'] },
        ];

        await PermissionSet.insertMany(roles);
        console.log('Permission sets created successfully!');
    } catch (err) {
        console.error('Error while creating permission sets:', err.message);
    }
};

module.exports = seedPermissions;
