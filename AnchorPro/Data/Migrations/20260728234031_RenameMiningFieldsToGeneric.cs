using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameMiningFieldsToGeneric : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MiningActivity",
                table: "ShiftProductionLogs",
                newName: "OperationActivity");

            migrationBuilder.RenameColumn(
                name: "TargetTonnage",
                table: "ShiftPlanTasks",
                newName: "TargetSecondary");

            migrationBuilder.RenameColumn(
                name: "DrillRingAndHole",
                table: "ShiftPlanTasks",
                newName: "ReferenceCode");

            migrationBuilder.RenameColumn(
                name: "OverallTargetTonnage",
                table: "ShiftPlans",
                newName: "OverallTargetSecondary");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OperationActivity",
                table: "ShiftProductionLogs",
                newName: "MiningActivity");

            migrationBuilder.RenameColumn(
                name: "TargetSecondary",
                table: "ShiftPlanTasks",
                newName: "TargetTonnage");

            migrationBuilder.RenameColumn(
                name: "ReferenceCode",
                table: "ShiftPlanTasks",
                newName: "DrillRingAndHole");

            migrationBuilder.RenameColumn(
                name: "OverallTargetSecondary",
                table: "ShiftPlans",
                newName: "OverallTargetTonnage");
        }
    }
}
