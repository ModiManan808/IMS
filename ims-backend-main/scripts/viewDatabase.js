const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

async function showDatabaseContents() {
    try {
        // Get all tables
        const [tables] = await sequelize.query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        `);

        console.log('\n========================================');
        console.log('IMS DATABASE CONTENTS');
        console.log('========================================\n');

        for (const table of tables) {
            const tableName = table.name;
            console.log(`\n📊 TABLE: ${tableName}`);
            console.log('-'.repeat(50));

            // Get count
            const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            const count = countResult[0].count;
            console.log(`Total Records: ${count}\n`);

            if (count > 0) {
                // Get all records
                const [records] = await sequelize.query(`SELECT * FROM ${tableName}`);

                records.forEach((record, index) => {
                    console.log(`Record #${index + 1}:`);
                    Object.entries(record).forEach(([key, value]) => {
                        console.log(`  ${key}: ${value}`);
                    });
                    console.log('');
                });
            } else {
                console.log('(No records)\n');
            }
        }

        console.log('========================================\n');
        await sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

showDatabaseContents();
