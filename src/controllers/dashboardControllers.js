const Checklist = require('../models/checklist');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');
const Opportunity = require('../models/opportunity/presaleOpportunity');
const Project = require('../models/project/project');
const Template = require('../models/template/template');
const UserMaster = require('../models/userMaster');

module.exports = {
    getWeeklyChanges: async (req, res) => {
        try {
            const currentDate = new Date();

            const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
            const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));

            const startOfLastWeek = new Date(currentDate.setDate(startOfWeek.getDate() - 7));
            const endOfLastWeek = new Date(currentDate.setDate(startOfLastWeek.getDate() + 6));

            const [totalUsers, totalOpportunities, totalProjects, totalTemplates] = await Promise.all([
                UserMaster.countDocuments(),
                Opportunity.countDocuments(),
                Project.countDocuments(),
                Template.countDocuments()
            ]);

            const [usersThisWeek, opportunitiesThisWeek, projectsThisWeek, templatesThisWeek] = await Promise.all([
                UserMaster.countDocuments({ createdAt: { $gte: startOfWeek, $lte: endOfWeek } }),
                Opportunity.countDocuments({ createdAt: { $gte: startOfWeek, $lte: endOfWeek } }),
                Project.countDocuments({ createdAt: { $gte: startOfWeek, $lte: endOfWeek } }),
                Template.countDocuments({ createdAt: { $gte: startOfWeek, $lte: endOfWeek } })
            ]);

            const [usersLastWeek, opportunitiesLastWeek, projectsLastWeek, templatesLastWeek] = await Promise.all([
                UserMaster.countDocuments({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } }),
                Opportunity.countDocuments({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } }),
                Project.countDocuments({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } }),
                Template.countDocuments({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } })
            ]);

            const calculateChange = (thisWeek, lastWeek) => {
                if (lastWeek === 0) {
                    return thisWeek === 0 ? 0 : 100;
                }
                return ((thisWeek - lastWeek) / lastWeek) * 100;
            };

            const changes = {
                usersChange: calculateChange(usersThisWeek, usersLastWeek),
                opportunitiesChange: calculateChange(opportunitiesThisWeek, opportunitiesLastWeek),
                projectsChange: calculateChange(projectsThisWeek, projectsLastWeek),
                templatesChange: calculateChange(templatesThisWeek, templatesLastWeek)
            };

            return res.status(200).json({
                EC: 0,
                message: "Weekly changes fetched successfully",
                data: {
                    totalCounts: {
                        totalUsers,
                        totalOpportunities,
                        totalProjects,
                        totalTemplates
                    },
                    changes: {
                        usersChange: changes.usersChange,
                        opportunitiesChange: changes.opportunitiesChange,
                        projectsChange: changes.projectsChange,
                        templatesChange: changes.templatesChange
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching weekly changes:', error);
            return res.status(500).json({
                EC: 1,
                message: "Error fetching weekly changes",
                data: { error: error.message }
            });
        }
    },
    getOpportunityStatusSummary: async (req, res) => {
        try {
            const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
                Opportunity.countDocuments({ approveStatus: 'Pending' }),
                Opportunity.countDocuments({ approveStatus: 'Approved' }),
                Opportunity.countDocuments({ approveStatus: 'Rejected' })
            ]);

            const opportunitySummaryData = {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [
                    {
                        data: [pendingCount, approvedCount, rejectedCount],
                        backgroundColor: ['#3E95CD', '#8E5EA2', '#FF0000'],
                    },
                ],
            };

            return res.status(200).json({
                EC: 0,
                message: "Opportunity status summary fetched successfully",
                data: opportunitySummaryData
            });

        } catch (error) {
            console.error('Error fetching opportunity status summary:', error);
            return res.status(500).json({
                EC: 1,
                message: "Error fetching opportunity status summary",
                data: { error: error.message }
            });
        }
    },
    getProjectStatusSummary: async (req, res) => {
        try {
            const [pendingCount, inProgressCount, inReviewCount, completedCount, archiveCount, rejectedCount] = await Promise.all([
                Project.countDocuments({ status: 'Pending' }),
                Project.countDocuments({ status: 'In Progress' }),
                Project.countDocuments({ status: 'In Review' }),
                Project.countDocuments({ status: 'Completed' }),
                Project.countDocuments({ status: 'Archive' }),
                Project.countDocuments({ status: 'Rejected' })
            ]);

            const projectSummaryData = {
                labels: ['Pending', 'In Progress', 'In Review', 'Completed', 'Archive', 'Rejected'],
                datasets: [
                    {
                        label: 'Projects',
                        data: [pendingCount, inProgressCount, inReviewCount, completedCount, archiveCount, rejectedCount],
                        backgroundColor: ['#3E95CD', '#3CBA9F', '#FF0000', '#FFCE56', '#9B59B6', '#E74C3C'],
                    },
                ],
            };

            return res.status(200).json({
                EC: 0,
                message: "Project status summary fetched successfully",
                data: projectSummaryData
            });

        } catch (error) {
            console.error('Error fetching project status summary:', error);
            return res.status(500).json({
                EC: 1,
                message: "Error fetching project status summary",
                data: { error: error.message }
            });
        }
    },
    getTemplateStatusSummary: async (req, res) => {
        try {
            const [draftCount, publishedCount, archivedCount] = await Promise.all([
                Template.countDocuments({ status: 'Draft' }),
                Template.countDocuments({ status: 'Published' }),
                Template.countDocuments({ status: 'Archived' })
            ]);

            const templateSummaryData = {
                labels: ['Draft', 'Published', 'Archived'],
                datasets: [
                    {
                        label: 'Templates',
                        data: [draftCount, publishedCount, archivedCount],
                        backgroundColor: ['#FFC107', '#4CAF50', '#F44336'],
                    },
                ],
            };

            return res.status(200).json({
                EC: 0,
                message: "Template status summary fetched successfully",
                data: templateSummaryData
            });

        } catch (error) {
            console.error('Error fetching template status summary:', error);
            return res.status(500).json({
                EC: 1,
                message: "Error fetching template status summary",
                data: { error: error.message }
            });
        }
    }
};
