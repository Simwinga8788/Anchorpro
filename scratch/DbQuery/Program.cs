using System;
using System.Threading.Tasks;
using Npgsql;

namespace DbQuery
{
    class Program
    {
        static async Task Main(string[] args)
        {
            string connString = "Host=aws-0-eu-west-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.hccwermcixoptvgrqypc;Password=386599/33/1;SSL Mode=Require;Trust Server Certificate=true;";

            using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();
            Console.WriteLine("Connected to database!");

            Console.WriteLine("\n--- CONTRACTS COUNT ---");
            string contractQuery = "SELECT COUNT(1), SUM(CASE WHEN \"Status\" = 1 THEN 1 ELSE 0 END) FROM \"EmploymentContracts\";";
            using (var cmd = new NpgsqlCommand(contractQuery, conn))
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    long total = reader.GetInt64(0);
                    long active = reader.IsDBNull(1) ? 0 : reader.GetInt64(1);
                    Console.WriteLine("Total Contracts: {0} | Active Contracts: {1}", total, active);
                }
            }

            Console.WriteLine("\n--- PAYROLL RUNS ---");
            string payrollQuery = "SELECT \"Id\", \"PeriodMonth\", \"PeriodYear\", \"Status\", \"TotalGross\", \"TotalNet\" FROM \"PayrollRuns\" ORDER BY \"Id\";";
            using (var cmd = new NpgsqlCommand(payrollQuery, conn))
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    int id = reader.GetInt32(0);
                    int month = reader.GetInt32(1);
                    int year = reader.GetInt32(2);
                    int status = reader.GetInt32(3);
                    decimal gross = reader.GetDecimal(4);
                    decimal net = reader.GetDecimal(5);
                    Console.WriteLine("ID: {0} | Period: {1}/{2} | Status: {3} | Gross: {4} | Net: {5}", id, month, year, status, gross, net);
                }
            }
        }
    }
}
