const cron = require('node-cron');
const moment = require('moment');
const PresalePlan = require('../models/opportunity/presalePlan');
const PresalePlanComment = require('../models/opportunity/presalePlanComments');

const checkPendingStatus = async () => {
    try {
        const presalePlans = await PresalePlan.find({ status: 'Pending' });
        const currentDate = moment();

        for (let presalePlan of presalePlans) {
            if (currentDate.isAfter(moment(presalePlan.pendingUntil))) {
                const comments = await PresalePlanComment.find({ presalePlan: presalePlan._id });
                const approvedCount = comments.filter(c => c.approvalStatus === 'Approved').length;

                if (approvedCount >= 10) {
                    presalePlan.status = 'Approved';
                } else {
                    presalePlan.status = 'Rejected';
                    presalePlan.rejectionReason = 'Not enough approvals in time';
                }
                await presalePlan.save();
            }
        }

        console.log('Pending status checked and updated successfully');
    } catch (error) {
        console.error('Error checking pending status:', error.message);
    }
};

// Set cron job to run every day at midnight
cron.schedule('0 0 * * *', checkPendingStatus);
