const { Client } = require('pg');
// Set ANCHORPRO_DB_CONNECTION to a postgres:// URI before running this script — never hardcode credentials here.
if (!process.env.ANCHORPRO_DB_CONNECTION) {
    throw new Error('ANCHORPRO_DB_CONNECTION environment variable is not set.');
}
const client = new Client(process.env.ANCHORPRO_DB_CONNECTION);
client.connect().then(() => client.query('SELECT "Id", "TenantId", "Amount", "Description" FROM "LedgerEntries" ORDER BY "CreatedAt" DESC LIMIT 5')).then(res => {
    console.log(res.rows);
    client.end();
}).catch(console.error);
