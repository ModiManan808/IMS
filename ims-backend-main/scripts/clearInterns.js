const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

async function clearInternData() {
    try {
        console.log('\n========================================');
        console.log('CLEARING INTERN DATA');
        console.log('========================================\n');

        // Delete all daily reports
        const [dailyReportsDeleted] = await sequelize.query('DELETE FROM DailyReports');
        console.log(`✅ Deleted ${dailyReportsDeleted} daily reports`);

        // Delete all interns
        const [internsDeleted] = await sequelize.query('DELETE FROM Interns');
        console.log(`✅ Deleted ${internsDeleted} intern records`);

        // Verify
        const [reportCount] = await sequelize.query('SELECT COUNT(*) as count FROM DailyReports');
        const [internCount] = await sequelize.query('SELECT COUNT(*) as count FROM Interns');

        console.log('\n📊 Current Database Status:');
        console.log(`  - Interns: ${internCount[0].count}`);
        console.log(`  - Daily Reports: ${reportCount[0].count}`);

        // Check admin still exists
        const [adminCount] = await sequelize.query('SELECT COUNT(*) as count FROM Admins');
        console.log(`  - Admins: ${adminCount[0].count} ✅`);

        console.log('\n✅ Database cleared successfully!');
        console.log('========================================\n');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

clearInternData();
