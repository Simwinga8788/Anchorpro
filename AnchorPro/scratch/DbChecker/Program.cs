
using System;
using System.Linq;
using Npgsql;
var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");
using var conn = new NpgsqlConnection(connString);
conn.Open();

const int tenantId = 6;
const string orgName = "Retrix Enterprise";

// The Settings page's "Save" action writes Tenant.Name and the Org.Name SystemSetting
// together (handleSaveOrg in dashboard/settings/page.tsx), so once both hold the same
// value here they'll stay in sync going forward via that existing dual-write — no code
// change needed, this is a one-time catch-up. The Org.Name setting was found missing
// entirely for this tenant, so recreate it alongside syncing Tenant.Name.

Console.WriteLine("--- Upserting Org.Name setting ---");
bool orgNameExists;
using (var cmd = new NpgsqlCommand(
    "SELECT COUNT(*) FROM \"SystemSettings\" WHERE \"TenantId\" = @tid AND \"Key\" = 'Org.Name'", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    orgNameExists = (long)cmd.ExecuteScalar()! > 0;
}

if (orgNameExists)
{
    using var cmd = new NpgsqlCommand(
        "UPDATE \"SystemSettings\" SET \"Value\" = @value WHERE \"TenantId\" = @tid AND \"Key\" = 'Org.Name'", conn);
    cmd.Parameters.AddWithValue("tid", tenantId);
    cmd.Parameters.AddWithValue("value", orgName);
    var rows = cmd.ExecuteNonQuery();
    Console.WriteLine($"Updated existing Org.Name ({rows} row)");
}
else
{
    using var cmd = new NpgsqlCommand(
        "INSERT INTO \"SystemSettings\" (\"TenantId\", \"Key\", \"Value\", \"Description\", \"Group\") " +
        "VALUES (@tid, 'Org.Name', @value, 'Organisation name', 'Org')", conn);
    cmd.Parameters.AddWithValue("tid", tenantId);
    cmd.Parameters.AddWithValue("value", orgName);
    var rows = cmd.ExecuteNonQuery();
    Console.WriteLine($"Inserted Org.Name ({rows} row)");
}

Console.WriteLine("--- Syncing Tenant.Name ---");
using (var cmd = new NpgsqlCommand("UPDATE \"Tenants\" SET \"Name\" = @name, \"UpdatedAt\" = now() WHERE \"Id\" = @id", conn))
{
    cmd.Parameters.AddWithValue("id", tenantId);
    cmd.Parameters.AddWithValue("name", orgName);
    var rows = cmd.ExecuteNonQuery();
    Console.WriteLine($"Tenant.Name rows updated: {rows}");
}

Console.WriteLine("--- Verify ---");
using (var cmd = new NpgsqlCommand("SELECT \"Id\", \"Name\" FROM \"Tenants\" WHERE \"Id\" = @id", conn))
{
    cmd.Parameters.AddWithValue("id", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read()) Console.WriteLine($"Tenant: Id={reader[0]} Name={reader[1]}");
}
using (var cmd = new NpgsqlCommand("SELECT \"Value\" FROM \"SystemSettings\" WHERE \"TenantId\" = @tid AND \"Key\" = 'Org.Name'", conn))
{
    cmd.Parameters.AddWithValue("tid", tenantId);
    Console.WriteLine($"Org.Name setting = {cmd.ExecuteScalar()}");
}
