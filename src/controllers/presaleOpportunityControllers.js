const Opportunity = require('../models/opportunity/presaleOpportunity');
const UserMaster = require('../models/userMaster');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');
const moment = require('moment');
const PermissionSet = require('../models/permissionSet');
const OpportunityVersion = require('../models/opportunity/presaleOpportunityVersion');
const OpportunityComment = require('../models/opportunity/presaleOpportunityComment');
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

        const { name, customerName, description, department, opportunityLead, timeline, scope, budget, status, category, nation, moneyType } = req.body;

        try {
            const user = await UserMaster.findById(req.user.id).populate('role division department');

            if (user.role.roleName !== 'Presale Division' && user.role.roleName !== 'Presale Department') {
                return res.status(403).json({
                    EC: 1,
                    message: 'Unauthorized',
                    data: { result: 'You do not have permission to create an Opportunity.' }
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

            let division, dept = department;
            if (user.role.roleName === 'Presale Division') {
                division = user.division._id;
                dept = null;
            } else if (user.role.roleName === 'Presale Department') {
                division = user.division._id;
                dept = user.department._id;
            }

            const newOpportunity = new Opportunity({
                name: sanitizeString(name),
                customerName: sanitizeString(customerName),
                description: sanitizeString(description),
                division,
                department: dept,
                opportunityLead,
                timeline: sanitizeString(timeline),
                scope: sanitizeString(scope),
                budget,
                status,
                category,
                nation: sanitizeString(nation),
                moneyType: sanitizeString(moneyType)
            });

            await newOpportunity.save();

            const newOpportunityVersion = new OpportunityVersion({
                opportunity: newOpportunity._id,
                approvalStatus: 'Pending',
                comment: 'Created Opportunity',
                versionNumber: 1,
                createdBy: req.user.id
            });

            await newOpportunityVersion.save();

            return res.status(201).json({
                EC: 0,
                message: 'Opportunity created successfully',
                data: newOpportunity
            });
        } catch (error) {
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
        const { name, customerName, description, department, opportunityLead, timeline, scope, budget, status, category, nation, moneyType } = req.body;

        try {
            const opportunity = await Opportunity.findById(id);
            if (!opportunity) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity not found',
                    data: null
                });
            }

            const user = await UserMaster.findById(req.user.id).populate('role division department');

            if (user.role.roleName !== 'Presale Division' && user.role.roleName !== 'Presale Department') {
                return res.status(403).json({
                    EC: 1,
                    message: 'Unauthorized',
                    data: { result: 'You do not have permission to update this Opportunity.' }
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

            let division, dept = department;
            if (user.role.roleName === 'Presale Division') {
                division = user.division._id;
                dept = null;
            } else if (user.role.roleName === 'Presale Department') {
                division = user.division._id;
                dept = user.department._id;
            }

            const changes = [];
            if (name && name !== opportunity.name) changes.push(`Name changed from ${opportunity.name} to ${name}`);
            if (customerName && customerName !== opportunity.customerName) changes.push(`Customer name changed from ${opportunity.customerName} to ${customerName}`);
            if (description && description !== opportunity.description) changes.push(`Description changed from ${opportunity.description} to ${description}`);
            if (opportunityLead && opportunityLead !== opportunity.opportunityLead.toString()) changes.push(`Opportunity lead changed`);
            if (timeline && timeline !== opportunity.timeline) changes.push(`Timeline changed from ${opportunity.timeline} to ${timeline}`);
            if (scope && scope !== opportunity.scope) changes.push(`Scope changed`);
            if (budget && budget !== opportunity.budget) changes.push(`Budget changed from ${opportunity.budget} to ${budget}`);
            if (status && status !== opportunity.status) changes.push(`Status changed from ${opportunity.status} to ${status}`);
            if (category && category !== opportunity.category.toString()) changes.push(`Category changed`);
            if (nation && nation !== opportunity.nation) changes.push(`Nation changed from ${opportunity.nation} to ${nation}`);
            if (moneyType && moneyType !== opportunity.moneyType) changes.push(`Money type changed from ${opportunity.moneyType} to ${moneyType}`);

            const newVersion = new OpportunityVersion({
                opportunity: opportunity._id,
                versionNumber: opportunity.version || 1,
                changes: changes.join(', '),
                updatedBy: req.user._id
            });

            await newVersion.save();

            opportunity.name = sanitizeString(name) || opportunity.name;
            opportunity.customerName = sanitizeString(customerName) || opportunity.customerName;
            opportunity.description = sanitizeString(description) || opportunity.description;
            opportunity.division = division || opportunity.division;
            opportunity.department = dept || opportunity.department;
            opportunity.opportunityLead = opportunityLead || opportunity.opportunityLead;
            opportunity.timeline = sanitizeString(timeline) || opportunity.timeline;
            opportunity.scope = sanitizeString(scope) || opportunity.scope;
            opportunity.budget = budget || opportunity.budget;
            opportunity.status = status || opportunity.status;
            opportunity.category = category || opportunity.category;
            opportunity.nation = sanitizeString(nation) || opportunity.nation;
            opportunity.moneyType = sanitizeString(moneyType) || opportunity.moneyType;
            opportunity.version += 1;

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

            const user = await UserMaster.findById(req.user.id).populate('role division department');

            if (user.role.roleName === 'Presale Division') {
                opportunities = await Opportunity.findWithDeleted({
                    division: user.division._id
                })
                    .populate('division department opportunityLead category')
                    .sort(sortCriteria)
                    .exec();

            } else if (user.role.roleName === 'Presale Department') {
                opportunities = await Opportunity.findWithDeleted({
                    division: user.division._id,
                    department: user.department._id
                })
                    .populate('division department opportunityLead category')
                    .sort(sortCriteria)
                    .exec();

            } else if (user.role.roleName === 'Opportunity') {
                opportunities = await Opportunity.find({
                    opportunityLead: user._id
                })
                    .populate('division department opportunityLead category')
                    .sort(sortCriteria)
                    .exec();
            } else {
                return res.status(403).json({
                    EC: 1,
                    message: 'Unauthorized',
                    data: { result: 'You do not have permission to view Opportunities.' }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Opportunities fetched successfully',
                data: { result: opportunities }
            });
        } catch (error) {
            console.log('Error fetching opportunities:', error.message);
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching opportunities',
                data: { error: error.message }
            });
        }
    },
    getApprovedOpportunities: async (req, res) => {
        try {
            const { includeDeleted, includeApproveOnly } = req.query;
            const sortCriteria = { deleted: 1, createdAt: -1 };

            let opportunities;

            const user = await UserMaster.findById(req.user.id).populate('role division department');

            let filterCriteria = {};

            if (includeApproveOnly === 'true') {
                filterCriteria.approvalStatus = 'Approved';
            }

            if (user.role.roleName === 'Presale Division') {
                filterCriteria.division = user.division._id;

                if (includeDeleted === 'true') {
                    opportunities = await Opportunity.findWithDeleted(filterCriteria)
                        .populate('division department opportunityLead category')
                        .sort(sortCriteria)
                        .exec();
                } else {
                    opportunities = await Opportunity.find(filterCriteria)
                        .populate('division department opportunityLead category')
                        .sort(sortCriteria)
                        .exec();
                }

            } else if (user.role.roleName === 'Presale Department') {
                filterCriteria.division = user.division._id;
                filterCriteria.department = user.department._id;

                if (includeDeleted === 'true') {
                    opportunities = await Opportunity.findWithDeleted(filterCriteria)
                        .populate('division department opportunityLead category')
                        .sort(sortCriteria)
                        .exec();
                } else {
                    opportunities = await Opportunity.find(filterCriteria)
                        .populate('division department opportunityLead category')
                        .sort(sortCriteria)
                        .exec();
                }

            } else if (user.role.roleName === 'Opportunity') {
                filterCriteria.opportunityLead = user._id;

                opportunities = await Opportunity.find(filterCriteria)
                    .populate('division department opportunityLead category')
                    .sort(sortCriteria)
                    .exec();

            } else {
                return res.status(403).json({
                    EC: 1,
                    message: 'Unauthorized',
                    data: { result: 'You do not have permission to view Opportunities.' }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Approved Opportunities fetched successfully',
                data: { result: opportunities }
            });
        } catch (error) {
            console.log('Error fetching approved opportunities:', error.message);
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching approved opportunities',
                data: { error: error.message }
            });
        }
    },

    getOpportunityLeadComment: async (req, res) => {
        const { opportunityId } = req.params;

        try {
            const latestVersion = await OpportunityComment.find({ opportunity: opportunityId })
                .populate('createdBy opportunity')
                .sort({ createdAt: -1 })
                .exec();

            if (!latestVersion) {
                return res.status(404).json({
                    EC: 1,
                    message: 'No comment found for this opportunity',
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Latest opportunity comment fetched successfully',
                data: latestVersion
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching opportunity comment',
                data: { error: error.message }
            });
        }
    },

    getOpportunityVersion: async (req, res) => {
        const { opportunityId } = req.params;

        try {
            const latestVersion = await OpportunityVersion.find({ opportunity: opportunityId })
                .populate('createdBy opportunity')
                .exec();

            if (!latestVersion) {
                return res.status(404).json({
                    EC: 1,
                    message: 'No version found for this opportunity',
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'oppotunity version fetched successfully',
                data: latestVersion
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching opportunity version',
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

            const newVersion = new OpportunityVersion({
                opportunity: opportunity._id,
                approvalStatus: 'Deleted',
                comment: 'Deleted Opportunity',
                createdBy: req.user._id
            });

            await newVersion.save();
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

            const newVersion = new OpportunityVersion({
                opportunity: opportunity._id,
                approvalStatus: 'Pending',
                comment: 'Restored Opportunity',
                createdBy: req.user._id
            });

            await newVersion.save();
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
    updateOpportunityAfterRejection: async (req, res) => {
        const { id } = req.params;
        const { name, customerName, description, timeline, scope, budget, category, nation, moneyType } = req.body;

        try {
            const opportunity = await Opportunity.findById(id);
            if (!opportunity || opportunity.approvalStatus !== 'Rejected') {
                return res.status(400).json({
                    EC: 1,
                    message: 'Opportunity must be in Rejected state to edit',
                    data: null
                });
            }

            // Create a new version for the edited opportunity after rejection
            const newVersion = new OpportunityVersion({
                opportunity: opportunity._id,
                approvalStatus: 'In Review',
                comment: 'Edited Opportunity after Rejection',
                createdBy: req.user._id
            });

            opportunity.name = sanitizeString(name) || opportunity.name;
            opportunity.customerName = sanitizeString(customerName) || opportunity.customerName;
            opportunity.description = sanitizeString(description) || opportunity.description;
            opportunity.timeline = sanitizeString(timeline) || opportunity.timeline;
            opportunity.scope = sanitizeString(scope) || opportunity.scope;
            opportunity.budget = budget || opportunity.budget;
            opportunity.category = category || opportunity.category;
            opportunity.nation = sanitizeString(nation) || opportunity.nation;
            opportunity.moneyType = sanitizeString(moneyType) || opportunity.moneyType;
            opportunity.approvalStatus = 'Pending';  // Reset to pending for review again

            await opportunity.save();
            await newVersion.save();

            return res.status(200).json({
                EC: 0,
                message: 'Opportunity updated after rejection successfully',
                data: { opportunity, version: newVersion }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating opportunity after rejection',
                data: { error: error.message }
            });
        }
    },
    updateApprovalStatus: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { id } = req.params;
        const { approvalStatus, comment } = req.body;
        const userId = req.user.id;

        try {
            const opportunity = await Opportunity.findById(id);
            if (!opportunity) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Opportunity not found',
                    data: null
                });
            }

            const user = await UserMaster.findById(userId).populate('role');
            if (!user || user.role.roleName !== 'Opportunity') {
                return res.status(403).json({
                    EC: 1,
                    message: 'Unauthorized. Only OpportunityLead can update approval status.',
                    data: null
                });
            }

            if (approvalStatus === 'Approved') {
                opportunity.version = Math.floor(opportunity.version) + 1;
            } else if (approvalStatus === 'Rejected') {
                const decimalPart = opportunity.version % 1;
                const newDecimalPart = decimalPart === 0 ? 0.1 : decimalPart + 0.1;
                opportunity.version = Math.floor(opportunity.version) + newDecimalPart;
            }

            opportunity.approvalStatus = approvalStatus;

            const newVersion = new OpportunityVersion({
                opportunity: opportunity._id,
                approvalStatus,
                comment: "This opportunity has been " + approvalStatus,
                createdBy: userId,
                versionNumber: opportunity.version
            });

            const newComment = new OpportunityComment({
                opportunity: opportunity._id,
                comment,
                approvalStatus,
                createdBy: userId,
            });

            await newVersion.save();
            await newComment.save();
            await opportunity.save();

            return res.status(200).json({
                EC: 0,
                message: `Opportunity has been ${approvalStatus}`,
                data: { opportunity, version: newVersion }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating opportunity approval status',
                data: { error: error.message }
            });
        }
    }

};
