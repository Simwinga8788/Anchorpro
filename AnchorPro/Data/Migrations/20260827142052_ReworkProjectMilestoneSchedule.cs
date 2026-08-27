using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReworkProjectMilestoneSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "ProjectMilestones");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "ProjectMilestones",
                newName: "PlannedStartDate");

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualEndDate",
                table: "ProjectMilestones",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualStartDate",
                table: "ProjectMilestones",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "ProjectMilestones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PlannedEndDate",
                table: "ProjectMilestones",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "PredecessorMilestoneId",
                table: "ProjectMilestones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProgressPercentage",
                table: "ProjectMilestones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "ProjectMilestones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Trade",
                table: "ProjectMilestones",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMilestones_PredecessorMilestoneId",
                table: "ProjectMilestones",
                column: "PredecessorMilestoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectMilestones_ProjectMilestones_PredecessorMilestoneId",
                table: "ProjectMilestones",
                column: "PredecessorMilestoneId",
                principalTable: "ProjectMilestones",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectMilestones_ProjectMilestones_PredecessorMilestoneId",
                table: "ProjectMilestones");

            migrationBuilder.DropIndex(
                name: "IX_ProjectMilestones_PredecessorMilestoneId",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "ActualEndDate",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "ActualStartDate",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "PlannedEndDate",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "PredecessorMilestoneId",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "ProgressPercentage",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "Trade",
                table: "ProjectMilestones");

            migrationBuilder.RenameColumn(
                name: "PlannedStartDate",
                table: "ProjectMilestones",
                newName: "Date");

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "ProjectMilestones",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
