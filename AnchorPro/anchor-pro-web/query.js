const { Client } = require('pg');
const client = new Client('postgres://postgres.hccwermcixoptvgrqypc:386599/33/1@aws-0-eu-west-1.pooler.supabase.com:5432/postgres');
client.connect().then(() => client.query('SELECT "Id", "TenantId", "Amount", "Description" FROM "LedgerEntries" ORDER BY "CreatedAt" DESC LIMIT 5')).then(res => {
    console.log(res.rows);
    client.end();
}).catch(console.error);
