using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkJobCardsToShiftPlanTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShiftPlanTaskId",
                table: "JobCards",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobCards_ShiftPlanTaskId",
                table: "JobCards",
                column: "ShiftPlanTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobCards_ShiftPlanTasks_ShiftPlanTaskId",
                table: "JobCards",
                column: "ShiftPlanTaskId",
                principalTable: "ShiftPlanTasks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobCards_ShiftPlanTasks_ShiftPlanTaskId",
                table: "JobCards");

            migrationBuilder.DropIndex(
                name: "IX_JobCards_ShiftPlanTaskId",
                table: "JobCards");

            migrationBuilder.DropColumn(
                name: "ShiftPlanTaskId",
                table: "JobCards");
        }
    }
}
