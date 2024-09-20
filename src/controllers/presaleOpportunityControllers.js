const Opportunity = require('../models/opportunity/presaleOpportunity');
const UserMaster = require('../models/userMaster');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');
const moment = require('moment');
const PermissionSet = require('../models/permissionSet');

module.exports = {
    createOpportunity: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { name, customerName, description, division, department, opportunityLead, timeline, scope, budget, category, nation, moneyType } = req.body;

        try {
            const lead = await UserMaster.findById(opportunityLead).populate('role');
            if (!lead || lead.role.roleName !== 'Opportunity') {
                return res.status(400).json({
                    EC: 1,
                    message: 'Invalid Opportunity Lead',
                    data: { result: 'Opportunity Lead must exist and have the correct role.' }
                });
            }

            const currentDate = moment().startOf('day');
            const timelineDate = moment(timeline);
            if (!timelineDate.isValid() || timelineDate.isBefore(currentDate.add(2, 'days'))) {
                return res.status(400).json({
                    EC: 1,
                    message: 'Invalid Timeline',
                    data: { result: 'Timeline must be at least 2 days after the current date.' }
                });
            }

            const newOpportunity = new Opportunity({
                name: sanitizeString(name),
                customerName: sanitizeString(customerName),
                description: sanitizeString(description),
                division,
                department,
                opportunityLead,
                timeline: sanitizeString(timeline),
                scope: sanitizeString(scope),
                budget,
                status: 'Open',
                category,
                nation: sanitizeString(nation),
                moneyType: sanitizeString(moneyType),
                approvalStatus: 'Pending',  // New: default approval status
                stage: 'New',                // New: default stage
                version: 1                   // New: initial version
            });

            await newOpportunity.save();

            return res.status(201).json({
                EC: 0,
                message: 'Opportunity created successfully',
                data: newOpportunity
            });
        } catch (error) {
            console.log('error', error.message);
            return res.status(500).json({
                EC: 1,
                message: 'Error creating opportunity',
                data: { error: error.message }
            });
        }
    },

    updateOpportunity: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { id } = req.params;
        const { name, customerName, description, division, department, opportunityLead, timeline, scope, budget, status, category, nation, moneyType, approvalStatus, approvalComment } = req.body;

        try {
            const opportunity = await Opportunity.findById(id);
            if (!opportunity) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity not found',
                    data: null
                });
            }

            const lead = await UserMaster.findById(opportunityLead).populate('role');
            if (!lead || lead.role.roleName !== 'Opportunity') {
                return res.status(400).json({
                    EC: 1,
                    message: 'Invalid Opportunity Lead',
                    data: { result: 'Opportunity Lead must exist and have the correct role.' }
                });
            }

            const currentDate = moment().startOf('day');
            const timelineDate = moment(timeline);
            if (!timelineDate.isValid() || timelineDate.isBefore(currentDate.add(2, 'days'))) {
                return res.status(400).json({
                    EC: 1,
                    message: 'Invalid Timeline',
                    data: { result: 'Timeline must be at least 2 days after the current date.' }
                });
            }

            opportunity.name = sanitizeString(name) || opportunity.name;
            opportunity.customerName = sanitizeString(customerName) || opportunity.customerName;
            opportunity.description = sanitizeString(description) || opportunity.description;
            opportunity.division = division || opportunity.division;
            opportunity.department = department || opportunity.department;
            opportunity.opportunityLead = opportunityLead || opportunity.opportunityLead;
            opportunity.timeline = sanitizeString(timeline) || opportunity.timeline;
            opportunity.scope = sanitizeString(scope) || opportunity.scope;
            opportunity.budget = budget || opportunity.budget;
            opportunity.status = status || opportunity.status;
            opportunity.category = category || opportunity.category;
            opportunity.nation = sanitizeString(nation) || opportunity.nation;
            opportunity.moneyType = sanitizeString(moneyType) || opportunity.moneyType;

            // New logic for approval
            if (approvalStatus) {
                opportunity.approvalStatus = approvalStatus;
                opportunity.approvalComment = sanitizeString(approvalComment);
                opportunity.approvalDate = new Date();

                if (approvalStatus === 'Rejected') {
                    opportunity.version += 1; // Increment version if rejected
                }

                if (approvalStatus === 'Approved') {
                    opportunity.stage = 'Approved'; // Change stage to Approved if approved
                }
            }

            await opportunity.save();

            return res.status(200).json({
                EC: 0,
                message: 'Opportunity updated successfully',
                data: opportunity
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating opportunity',
                data: { error: error.message }
            });
        }
    },
    getAllOpportunities: async (req, res) => {
        try {
            const { includeDeleted } = req.query;

            const sortCriteria = { deleted: 1, createdAt: -1 };

            let opportunities;

            if (includeDeleted === 'true') {
                opportunities = await Opportunity.findWithDeleted()
                    .populate('division department opportunityLead category')
                    .sort(sortCriteria)
                    .exec();
            } else {
                opportunities = await Opportunity.find()
                    .populate('division department opportunityLead category')
                    .sort(sortCriteria)
                    .exec();
            }

            return res.status(200).json({
                EC: 0,
                message: 'Opportunities fetched successfully',
                data: { result: opportunities }
            });
        } catch (error) {
            console.log('error', error.message);
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching opportunities',
                data: { error: error.message }
            });
        }
    },

    getOpportunityById: async (req, res) => {
        const { id } = req.params;

        try {
            const opportunity = await Opportunity.findById(id).populate('division department opportunityLead category');
            if (!opportunity) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity not found',
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Opportunity fetched successfully',
                data: { result: opportunity }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching opportunity',
                data: { error: error.message }
            });
        }
    },

    deleteOpportunity: async (req, res) => {
        const { id } = req.params;

        try {
            const opportunity = await Opportunity.findById(id);

            if (!opportunity) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity not found',
                    data: null
                });
            }

            await opportunity.delete();

            return res.status(200).json({
                EC: 0,
                message: 'Opportunity deleted successfully',
                data: { result: opportunity }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error deleting opportunity',
                data: { error: error.message }
            });
        }
    },

    restoreOpportunity: async (req, res) => {
        const { id } = req.params;

        try {
            const opportunity = await Opportunity.findOneWithDeleted({ _id: id });

            if (!opportunity) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity not found',
                    data: null
                });
            }

            await opportunity.restore();

            return res.status(200).json({
                EC: 0,
                message: 'Opportunity restored successfully',
                data: { result: opportunity }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error restoring opportunity',
                data: { error: error.message }
            });
        }
    },
    getOpportunityLead: async (req, res) => {
        try {
            const opportunityLead = await PermissionSet.findOne({ roleName: 'Opportunity' });

            if (!opportunityLead) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity Lead role not found',
                    data: { result: null }
                });
            }

            //sort by name
            const leads = await UserMaster.find({ role: opportunityLead._id }).sort({ username: 1 });

            return res.status(200).json({
                EC: 0,
                message: 'Opportunity Leads fetched successfully',
                data: { result: leads }
            });
        } catch (error) {
            console.log('error', error.message);
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching Opportunity Leads',
                data: { result: null, error: error.message }
            });
        }
    },
};
