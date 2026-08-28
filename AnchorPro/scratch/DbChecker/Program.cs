using System;
using System.Linq;
using Npgsql;
// Set ANCHORPRO_DB_CONNECTION (Npgsql connection string format) before running — never hardcode credentials here.
var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");
using var conn = new NpgsqlConnection(connString);
conn.Open();

void RunQuery(string title, string sql)
{
    Console.WriteLine($"\n--- {title} ---");
    using var cmd = new NpgsqlCommand(sql, conn);
    using var reader = cmd.ExecuteReader();
    var colCount = reader.FieldCount;
    while (reader.Read())
    {
        var vals = Enumerable.Range(0, colCount).Select(i => reader.IsDBNull(i) ? "NULL" : reader.GetValue(i).ToString());
        Console.WriteLine(string.Join(" | ", vals));
    }
}

RunQuery("Tenants (id, name)", "SELECT \"Id\", \"Name\" FROM \"Tenants\" ORDER BY \"Id\";");

RunQuery("Projects: TenantId null vs not-null counts", @"
    SELECT
        COUNT(*) FILTER (WHERE ""TenantId"" IS NULL) AS null_tenant,
        COUNT(*) FILTER (WHERE ""TenantId"" IS NOT NULL) AS has_tenant,
        COUNT(*) AS total
    FROM ""Projects"";");

RunQuery("Projects: all rows (Id, Name, TenantId, CreatedBy)",
    "SELECT \"Id\", \"Name\", \"TenantId\", \"CreatedBy\" FROM \"Projects\" ORDER BY \"Id\";");

RunQuery("BillsOfQuantities: TenantId null vs not-null, by CreatedBy", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""BillsOfQuantities""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("PaymentCertificates: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""PaymentCertificates""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("Variations: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""Variations""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("ProjectTasks: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""ProjectTasks""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("ProjectMembers: by TenantId (no CreatedBy col assumption, count only)", @"
    SELECT ""TenantId"", COUNT(*)
    FROM ""ProjectMembers""
    GROUP BY ""TenantId"";");

RunQuery("ProjectMilestones: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""ProjectMilestones""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("ProjectDocuments: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""ProjectDocuments""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("SiteDiaryEntries: by CreatedBy / TenantId / ProjectId", @"
    SELECT ""CreatedBy"", ""TenantId"", ""ProjectId"", COUNT(*)
    FROM ""SiteDiaryEntries""
    GROUP BY ""CreatedBy"", ""TenantId"", ""ProjectId""
    ORDER BY ""CreatedBy"";");

RunQuery("BoqSections row count (no TenantId column on this child table)",
    "SELECT COUNT(*) FROM \"BoqSections\";");

RunQuery("BoqItems row count (no TenantId column on this child table)",
    "SELECT COUNT(*) FROM \"BoqItems\";");

RunQuery("PaymentCertificateItems row count (no TenantId column on this child table)",
    "SELECT COUNT(*) FROM \"PaymentCertificateItems\";");

RunQuery("WeeklyReports: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""WeeklyReports""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("MonthlyReports: by CreatedBy / TenantId", @"
    SELECT ""CreatedBy"", ""TenantId"", COUNT(*)
    FROM ""MonthlyReports""
    GROUP BY ""CreatedBy"", ""TenantId""
    ORDER BY ""CreatedBy"";");

RunQuery("Projects 4 and 5: full detail incl CreatedAt", @"
    SELECT ""Id"", ""Name"", ""TenantId"", ""CreatedBy"", ""CreatedAt"", ""Status""
    FROM ""Projects"" WHERE ""Id"" IN (4,5) ORDER BY ""Id"";");

RunQuery("ProjectTasks tied to Project 4 or 5", @"
    SELECT ""Id"", ""ProjectId"", ""TenantId"", ""CreatedBy"" FROM ""ProjectTasks""
    WHERE ""ProjectId"" IN (4,5);");

RunQuery("ProjectMembers tied to Project 4 or 5", @"
    SELECT ""Id"", ""ProjectId"", ""TenantId"", ""UserId"" FROM ""ProjectMembers""
    WHERE ""ProjectId"" IN (4,5);");

RunQuery("Any other child rows referencing Project 4 or 5 (BoQ/Certs/Diary/Milestones/Docs)", @"
    SELECT 'BillsOfQuantities' AS tbl, COUNT(*) FROM ""BillsOfQuantities"" WHERE ""ProjectId"" IN (4,5)
    UNION ALL SELECT 'PaymentCertificates', COUNT(*) FROM ""PaymentCertificates"" WHERE ""ProjectId"" IN (4,5)
    UNION ALL SELECT 'SiteDiaryEntries', COUNT(*) FROM ""SiteDiaryEntries"" WHERE ""ProjectId"" IN (4,5)
    UNION ALL SELECT 'ProjectMilestones', COUNT(*) FROM ""ProjectMilestones"" WHERE ""ProjectId"" IN (4,5)
    UNION ALL SELECT 'ProjectDocuments', COUNT(*) FROM ""ProjectDocuments"" WHERE ""ProjectId"" IN (4,5);");

RunQuery("Variations detail (ProjectId, CreatedBy, CreatedAt)", @"
    SELECT ""Id"", ""ProjectId"", ""TenantId"", ""CreatedBy"", ""CreatedAt"" FROM ""Variations"";");

RunQuery("Users referenced by GUID CreatedBy values seen so far", @"
    SELECT ""Id"", ""Email"" FROM ""AspNetUsers"" WHERE ""Id"" IN ('306fbf8a-d0aa-4660-a7d7-77e0ec9be91e') OR ""Email"" = 'simwinga87@gmail.com';");

RunQuery("Identify owner of Projects 4/5 (ProjectMember UserId) + their TenantId", @"
    SELECT u.""Id"", u.""Email"", u.""TenantId"" FROM ""AspNetUsers"" u
    WHERE u.""Id"" = '6cb73962-8b99-47aa-bb66-d4d57526b114';");

RunQuery("3rd ProjectMember row (likely Project 6)", @"
    SELECT ""Id"", ""ProjectId"", ""TenantId"", ""UserId"" FROM ""ProjectMembers"" ORDER BY ""Id"";");

RunQuery("Felix's own user row for confirmation", @"
    SELECT ""Id"", ""Email"", ""TenantId"" FROM ""AspNetUsers"" WHERE ""TenantId"" = 6;");

RunQuery("BoqSections TenantId status", @"
    SELECT ""Id"", ""BillOfQuantitiesId"", ""TenantId"" FROM ""BoqSections"" ORDER BY ""Id"";");

RunQuery("BoqItems TenantId status (count by TenantId)", @"
    SELECT ""TenantId"", COUNT(*) FROM ""BoqItems"" GROUP BY ""TenantId"";");

RunQuery("PaymentCertificateItems TenantId status (count by TenantId)", @"
    SELECT ""TenantId"", COUNT(*) FROM ""PaymentCertificateItems"" GROUP BY ""TenantId"";");

RunQuery("SiteDiaryLabours/Plants/Deliveries/Safeties TenantId status", @"
    SELECT 'Labours' AS tbl, ""TenantId"", COUNT(*) FROM ""SiteDiaryLabours"" GROUP BY ""TenantId""
    UNION ALL SELECT 'Plants', ""TenantId"", COUNT(*) FROM ""SiteDiaryPlants"" GROUP BY ""TenantId""
    UNION ALL SELECT 'Deliveries', ""TenantId"", COUNT(*) FROM ""SiteDiaryDeliveries"" GROUP BY ""TenantId""
    UNION ALL SELECT 'Safeties', ""TenantId"", COUNT(*) FROM ""SiteDiarySafeties"" GROUP BY ""TenantId"";");

RunQuery("EXACT IDs: BillsOfQuantities orphaned row", @"
    SELECT ""Id"", ""ProjectId"", ""Title"" FROM ""BillsOfQuantities"" WHERE ""TenantId"" IS NULL;");

RunQuery("EXACT IDs: PaymentCertificates orphaned rows", @"
    SELECT ""Id"", ""ProjectId"", ""CertificateNumber"" FROM ""PaymentCertificates"" WHERE ""TenantId"" IS NULL;");

RunQuery("EXACT IDs: SiteDiaryEntries orphaned row", @"
    SELECT ""Id"", ""ProjectId"", ""DiaryDate"" FROM ""SiteDiaryEntries"" WHERE ""TenantId"" IS NULL;");

RunQuery("EXACT IDs: Variations orphaned row", @"
    SELECT ""Id"", ""ProjectId"" FROM ""Variations"" WHERE ""TenantId"" IS NULL;");

RunQuery("EXACT IDs: BoqItems orphaned rows (should all be under BoqSectionId in {4,5,6})", @"
    SELECT ""Id"", ""BoqSectionId"", ""TenantId"" FROM ""BoqItems"" ORDER BY ""Id"";");

RunQuery("EXACT IDs: PaymentCertificateItems orphaned rows", @"
    SELECT ""Id"", ""PaymentCertificateId"", ""TenantId"" FROM ""PaymentCertificateItems"" WHERE ""TenantId"" IS NULL ORDER BY ""Id"";");

RunQuery("EXACT IDs: SiteDiary child rows orphaned (Labours/Plants/Deliveries/Safeties)", @"
    SELECT 'Labour' t, ""Id"", ""SiteDiaryEntryId"" FROM ""SiteDiaryLabours"" WHERE ""TenantId"" IS NULL
    UNION ALL SELECT 'Plant', ""Id"", ""SiteDiaryEntryId"" FROM ""SiteDiaryPlants"" WHERE ""TenantId"" IS NULL
    UNION ALL SELECT 'Delivery', ""Id"", ""SiteDiaryEntryId"" FROM ""SiteDiaryDeliveries"" WHERE ""TenantId"" IS NULL
    UNION ALL SELECT 'Safety', ""Id"", ""SiteDiaryEntryId"" FROM ""SiteDiarySafeties"" WHERE ""TenantId"" IS NULL;");
