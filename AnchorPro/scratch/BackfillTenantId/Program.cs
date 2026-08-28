// One-off data fix: backfills TenantId on the orphaned rows created by
// test_construction_suite.py, which inserts directly via raw SQL (psycopg2) and
// never sets TenantId. All rows below were confirmed via scratch/DbChecker to be:
//   - CreatedBy one of the script's literal role markers ("AutoTestRunner",
//     "QuantitySurveyor", "SiteAgent") or, for the Variation row, Felix's own
//     email used as CreatedBy instead of his user GUID (also a raw-SQL artifact) — see the
//     script's own INSERT statements for confirmation these are the only source.
//   - Every row's TenantId IS currently NULL (double-checked in the WHERE clause
//     below as a safety guard so this can never touch an already-tenanted row).
//   - Transitively reachable only from Project Id=6 ("Lusaka Commercial Complex -
//     Phase 1"), Felix's (tenantId=6, "Felix mining") own test project.
//
// Explicitly NOT touched: Project Ids 4 ("Road survey") and 5 ("Demo Project"),
// which are also TenantId-null but whose ProjectMember belongs to a user in
// TenantId=8 (simwinga2001@gmail.com) — different, unclear ownership, out of
// scope for this fix. See conversation notes / task report.
//
// Usage: set ANCHORPRO_DB_CONNECTION, then: dotnet run --project scratch/BackfillTenantId

using Npgsql;

const int tenantId = 6;

var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");

using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();
await using var tx = await conn.BeginTransactionAsync();

var statements = new[]
{
    ("Projects", "UPDATE \"Projects\" SET \"TenantId\" = @t WHERE \"Id\" = 6 AND \"TenantId\" IS NULL;"),
    ("BillsOfQuantities", "UPDATE \"BillsOfQuantities\" SET \"TenantId\" = @t WHERE \"Id\" = 2 AND \"TenantId\" IS NULL;"),
    ("BoqSections", "UPDATE \"BoqSections\" SET \"TenantId\" = @t WHERE \"Id\" IN (4,5,6) AND \"TenantId\" IS NULL;"),
    ("BoqItems", "UPDATE \"BoqItems\" SET \"TenantId\" = @t WHERE \"Id\" IN (6,7,8,9,10) AND \"TenantId\" IS NULL;"),
    ("PaymentCertificates", "UPDATE \"PaymentCertificates\" SET \"TenantId\" = @t WHERE \"Id\" IN (3,4) AND \"TenantId\" IS NULL;"),
    ("PaymentCertificateItems", "UPDATE \"PaymentCertificateItems\" SET \"TenantId\" = @t WHERE \"Id\" IN (6,7,8,9,10) AND \"TenantId\" IS NULL;"),
    ("SiteDiaryEntries", "UPDATE \"SiteDiaryEntries\" SET \"TenantId\" = @t WHERE \"Id\" = 2 AND \"TenantId\" IS NULL;"),
    ("SiteDiaryLabours", "UPDATE \"SiteDiaryLabours\" SET \"TenantId\" = @t WHERE \"Id\" IN (5,6,7,8) AND \"TenantId\" IS NULL;"),
    ("SiteDiaryPlants", "UPDATE \"SiteDiaryPlants\" SET \"TenantId\" = @t WHERE \"Id\" IN (4,5,6) AND \"TenantId\" IS NULL;"),
    ("SiteDiaryDeliveries", "UPDATE \"SiteDiaryDeliveries\" SET \"TenantId\" = @t WHERE \"Id\" IN (3,4) AND \"TenantId\" IS NULL;"),
    ("SiteDiarySafeties", "UPDATE \"SiteDiarySafeties\" SET \"TenantId\" = @t WHERE \"Id\" = 2 AND \"TenantId\" IS NULL;"),
    ("Variations", "UPDATE \"Variations\" SET \"TenantId\" = @t WHERE \"Id\" = 1 AND \"TenantId\" IS NULL;"),
};

var total = 0;
foreach (var (label, sql) in statements)
{
    await using var cmd = new NpgsqlCommand(sql, conn, tx);
    cmd.Parameters.AddWithValue("t", tenantId);
    var rows = await cmd.ExecuteNonQueryAsync();
    total += rows;
    Console.WriteLine($"{label,-24} -> {rows} row(s) updated");
}

await tx.CommitAsync();
Console.WriteLine($"\nBackfill complete. {total} row(s) updated to TenantId={tenantId}.");
