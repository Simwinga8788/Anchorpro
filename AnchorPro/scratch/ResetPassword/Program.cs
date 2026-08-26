// One-off tool to reset an AnchorPro user's login password directly in the database,
// using the exact same hashing algorithm ASP.NET Core Identity uses (so the app accepts it normally).
//
// Usage:
//   set ANCHORPRO_DB_CONNECTION first (Npgsql connection string format), then:
//   dotnet run --project scratch/ResetPassword -- "user@example.com" "NewStrongPassword!1"
//
// This does NOT touch source control or hardcode anything — the connection string comes from
// an environment variable, and the new password is only ever passed at the command line.

using Microsoft.AspNetCore.Identity;
using Npgsql;

if (args.Length != 2)
{
    Console.Error.WriteLine("Usage: dotnet run -- <email> <newPassword>");
    return 1;
}

var email = args[0];
var newPassword = args[1];

var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");

// ASP.NET Core Identity's default PasswordHasher doesn't actually read anything off the user
// object — it only hashes the password string — so a throwaway instance is fine here.
var hasher = new PasswordHasher<object>();
var hash = hasher.HashPassword(new object(), newPassword);
var newSecurityStamp = Guid.NewGuid().ToString();

using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();

const string sql = """
    UPDATE "AspNetUsers"
    SET "PasswordHash" = @hash,
        "SecurityStamp" = @stamp,
        "ConcurrencyStamp" = @concurrency,
        "LockoutEnd" = NULL,
        "AccessFailedCount" = 0
    WHERE lower("Email") = lower(@email)
    """;

await using var cmd = new NpgsqlCommand(sql, conn);
cmd.Parameters.AddWithValue("hash", hash);
cmd.Parameters.AddWithValue("stamp", newSecurityStamp);
cmd.Parameters.AddWithValue("concurrency", Guid.NewGuid().ToString());
cmd.Parameters.AddWithValue("email", email);

var rows = await cmd.ExecuteNonQueryAsync();

if (rows == 0)
{
    Console.Error.WriteLine($"No user found with email '{email}'.");
    return 1;
}

Console.WriteLine($"Password updated for '{email}'. You can log in with the new password now.");
return 0;
