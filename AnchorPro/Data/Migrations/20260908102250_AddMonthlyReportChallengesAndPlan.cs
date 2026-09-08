using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyReportChallengesAndPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChallengesNarrative",
                table: "MonthlyReports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NextMonthPlanNarrative",
                table: "MonthlyReports",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChallengesNarrative",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "NextMonthPlanNarrative",
                table: "MonthlyReports");
        }
    }
}
