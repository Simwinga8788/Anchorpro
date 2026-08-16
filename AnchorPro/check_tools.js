const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/anchorpro' });
client.connect().then(() => {
  return client.query('SELECT "Id", "Name", "TenantId" FROM "Tools"');
}).then(res => {
  console.log('--- TOOLS ---');
  console.table(res.rows);
  return client.query('SELECT "Id", "FirstName", "LastName", "TenantId" FROM "AspNetUsers"');
}).then(res => {
  console.log('--- USERS ---');
  console.table(res.rows);
}).catch(console.error).finally(() => client.end());
