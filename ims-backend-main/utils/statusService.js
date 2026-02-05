const { Intern } = require('../models');
const { Op } = require('sequelize');

/**
 * Automatically move interns from Active to Completed when end date passes
 * This should be called periodically (e.g., via cron job or scheduled task)
 */
exports.checkAndUpdateCompletedInterns = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const interns = await Intern.findAll({
            where: {
                status: 'Active',
                dateOfLeaving: {
                    [Op.lte]: today
                }
            }
        });

        for (const intern of interns) {
            intern.status = 'Completed';
            intern.role = 'Intern_completed';
            await intern.save();
        }

        console.log(`Updated ${interns.length} intern(s) to Completed status`);
        return interns.length;
    } catch (error) {
        console.error('Error updating completed interns:', error);
        throw error;
    }
};
