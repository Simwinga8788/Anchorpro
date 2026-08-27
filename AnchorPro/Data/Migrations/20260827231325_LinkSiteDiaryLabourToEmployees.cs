using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkSiteDiaryLabourToEmployees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TotalLabourCost",
                table: "WeeklyReports",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeUserId",
                table: "SiteDiaryLabours",
                type: "character varying(85)",
                maxLength: 85,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryLabours_EmployeeUserId",
                table: "SiteDiaryLabours",
                column: "EmployeeUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_SiteDiaryLabours_AspNetUsers_EmployeeUserId",
                table: "SiteDiaryLabours",
                column: "EmployeeUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SiteDiaryLabours_AspNetUsers_EmployeeUserId",
                table: "SiteDiaryLabours");

            migrationBuilder.DropIndex(
                name: "IX_SiteDiaryLabours_EmployeeUserId",
                table: "SiteDiaryLabours");

            migrationBuilder.DropColumn(
                name: "TotalLabourCost",
                table: "WeeklyReports");

            migrationBuilder.DropColumn(
                name: "EmployeeUserId",
                table: "SiteDiaryLabours");
        }
    }
}
