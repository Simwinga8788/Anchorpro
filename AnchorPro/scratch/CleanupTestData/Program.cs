// One-off cleanup: removes the test Site Diary entry (and children) created while
// verifying the Phase 1 Site Diary UI work, since there is no separate dev database —
// appsettings.Development.json points at the same live Supabase instance.
//
// Usage: set ANCHORPRO_DB_CONNECTION, then: dotnet run --project scratch/CleanupTestData

using Npgsql;

var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");

using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();

var statements = new[]
{
    // Test certificate IPC-03 (Id=5) created on project 6 while verifying the
    // certificate workflow-states change (submit/query/approve/issue/pay).
    "DELETE FROM \"PaymentCertificateItems\" WHERE \"PaymentCertificateId\" = 5;",
    "DELETE FROM \"PaymentCertificates\" WHERE \"Id\" = 5;"
};

foreach (var sql in statements)
{
    await using var cmd = new NpgsqlCommand(sql, conn);
    var rows = await cmd.ExecuteNonQueryAsync();
    Console.WriteLine($"{sql} -> {rows} row(s)");
}

Console.WriteLine("Cleanup complete.");
