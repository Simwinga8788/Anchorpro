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
    "DELETE FROM \"SiteDiaryPhotos\" WHERE \"Id\" IN (1, 2);",
    "DELETE FROM \"SiteDiaryLabours\" WHERE \"Id\" IN (9, 10);",
    "DELETE FROM \"SiteDiaryPlants\" WHERE \"Id\" IN (7);",
    "DELETE FROM \"SiteDiaryDeliveries\" WHERE \"Id\" IN (5);",
    "DELETE FROM \"SiteDiarySafeties\" WHERE \"Id\" IN (3);",
    "DELETE FROM \"SiteDiaryEntries\" WHERE \"Id\" = 3;"
};

foreach (var sql in statements)
{
    await using var cmd = new NpgsqlCommand(sql, conn);
    var rows = await cmd.ExecuteNonQueryAsync();
    Console.WriteLine($"{sql} -> {rows} row(s)");
}

Console.WriteLine("Cleanup complete.");
