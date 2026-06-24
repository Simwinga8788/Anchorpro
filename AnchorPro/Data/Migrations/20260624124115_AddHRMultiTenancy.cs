using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHRMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "PayslipEntries",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "PayslipEntries",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "PayslipEntries",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "PayrollRuns",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "PayrollRuns",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "PayrollRuns",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "EmploymentContracts",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "EmploymentContracts",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "EmploymentContracts",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "EmployeeProfiles",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "EmployeeProfiles",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "EmployeeProfiles",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "PayslipEntries");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "EmploymentContracts");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "EmployeeProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "PayslipEntries",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "PayslipEntries",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "PayrollRuns",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "PayrollRuns",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "EmploymentContracts",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "EmploymentContracts",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UpdatedBy",
                table: "EmployeeProfiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "EmployeeProfiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(85)",
                oldMaxLength: 85,
                oldNullable: true);
        }
    }
}
