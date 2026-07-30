using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftPlanLinkToLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ActualQuantity",
                table: "ShiftPlanTasks",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ShiftPlanTasks",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompletedByName",
                table: "ShiftPlanTasks",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompletedByUserId",
                table: "ShiftPlanTasks",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompletionNotes",
                table: "ShiftPlanTasks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "ShiftPlanTasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "ShiftPlanTasks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualQuantity",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "CompletedByName",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "CompletedByUserId",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "CompletionNotes",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "ShiftPlanTasks");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "ShiftPlanTasks");
        }
    }
}
