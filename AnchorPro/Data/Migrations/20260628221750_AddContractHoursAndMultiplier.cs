using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContractHoursAndMultiplier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "OvertimeMultiplier",
                table: "EmploymentContracts",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "StandardHoursPerMonth",
                table: "EmploymentContracts",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OvertimeMultiplier",
                table: "EmploymentContracts");

            migrationBuilder.DropColumn(
                name: "StandardHoursPerMonth",
                table: "EmploymentContracts");
        }
    }
}
