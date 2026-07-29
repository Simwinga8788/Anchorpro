using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkShiftLogToShiftPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PlannedQuantity",
                table: "ShiftResources",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ShiftPlanId",
                table: "ShiftProductionLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftProductionLogs_ShiftPlanId",
                table: "ShiftProductionLogs",
                column: "ShiftPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftProductionLogs_ShiftPlans_ShiftPlanId",
                table: "ShiftProductionLogs",
                column: "ShiftPlanId",
                principalTable: "ShiftPlans",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftProductionLogs_ShiftPlans_ShiftPlanId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropIndex(
                name: "IX_ShiftProductionLogs_ShiftPlanId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "PlannedQuantity",
                table: "ShiftResources");

            migrationBuilder.DropColumn(
                name: "ShiftPlanId",
                table: "ShiftProductionLogs");
        }
    }
}
