using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyReportScheduleStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BehindScheduleActivitiesCount",
                table: "WeeklyReports",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ProgramStatusNarrative",
                table: "WeeklyReports",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BehindScheduleActivitiesCount",
                table: "WeeklyReports");

            migrationBuilder.DropColumn(
                name: "ProgramStatusNarrative",
                table: "WeeklyReports");
        }
    }
}
