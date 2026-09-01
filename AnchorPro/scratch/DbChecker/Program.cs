
using System;
using System.Collections.Generic;
using System.Linq;
using Npgsql;
var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");
using var conn = new NpgsqlConnection(connString);
conn.Open();

// Every table that has a "TenantId" column, discovered from the DB itself rather than
// guessed from entity names — so nothing is missed.
var tables = new List<string>();
using (var cmd = new NpgsqlCommand(@"
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'TenantId'
    ORDER BY table_name;", conn))
using (var reader = cmd.ExecuteReader())
{
    while (reader.Read()) tables.Add(reader.GetString(0));
}

Console.WriteLine($"Found {tables.Count} tables with a TenantId column.\n");
Console.WriteLine($"{"Table",-35} {"NullTenant",12} {"Total",10} {"%Null",8}");
Console.WriteLine(new string('-', 68));

var results = new List<(string Table, long NullCount, long Total)>();

foreach (var table in tables)
{
    using var cmd = new NpgsqlCommand($@"
        SELECT
            COUNT(*) FILTER (WHERE ""TenantId"" IS NULL) AS null_count,
            COUNT(*) AS total
        FROM ""{table}"";", conn);
    using var reader = cmd.ExecuteReader();
    if (reader.Read())
    {
        var nullCount = reader.GetInt64(0);
        var total = reader.GetInt64(1);
        results.Add((table, nullCount, total));
    }
}

foreach (var r in results.OrderByDescending(r => r.NullCount))
{
    var pct = r.Total > 0 ? (double)r.NullCount / r.Total * 100 : 0;
    var flag = r.NullCount > 0 ? " <-- has orphaned rows" : "";
    Console.WriteLine($"{r.Table,-35} {r.NullCount,12} {r.Total,10} {pct,7:F1}%{flag}");
}

Console.WriteLine();
Console.WriteLine($"Total tables with at least one NULL TenantId row: {results.Count(r => r.NullCount > 0)} of {results.Count}");
