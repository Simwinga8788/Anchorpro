using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkShiftPlansToProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectTaskId",
                table: "ShiftPlanTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "ShiftPlans",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlanTasks_ProjectTaskId",
                table: "ShiftPlanTasks",
                column: "ProjectTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlans_ProjectId",
                table: "ShiftPlans",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftPlans_Projects_ProjectId",
                table: "ShiftPlans",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftPlanTasks_ProjectTasks_ProjectTaskId",
                table: "ShiftPlanTasks",
                column: "ProjectTaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftPlans_Projects_ProjectId",
                table: "ShiftPlans");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftPlanTasks_ProjectTasks_ProjectTaskId",
                table: "ShiftPlanTasks");

            migrationBuilder.DropIndex(
                name: "IX_ShiftPlanTasks_ProjectTaskId",
                table: "ShiftPlanTasks");

            migrationBuilder.DropIndex(
                name: "IX_ShiftPlans_ProjectId",
                table: "ShiftPlans");

            migrationBuilder.DropColumn(
                name: "ProjectTaskId",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "ShiftPlans");
        }
    }
}
