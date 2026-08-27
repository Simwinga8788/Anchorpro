
using System;
using System.Linq;
using Npgsql;
// Set ANCHORPRO_DB_CONNECTION (Npgsql connection string format) before running — never hardcode credentials here.
var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");
using var conn = new NpgsqlConnection(connString);
conn.Open();

Console.WriteLine("--- ProjectMilestones row count ---");
using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"ProjectMilestones\"", conn))
using (var reader = cmd.ExecuteReader())
{
    while (reader.Read()) Console.WriteLine($"{reader[0]}");
}

