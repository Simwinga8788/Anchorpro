using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftLogMiningFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DestinationLocation",
                table: "ShiftProductionLogs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LoadCount",
                table: "ShiftProductionLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PayloadFactor",
                table: "ShiftProductionLogs",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceLocation",
                table: "ShiftProductionLogs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PayloadCapacity",
                table: "Equipment",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinationLocation",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "LoadCount",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "PayloadFactor",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "SourceLocation",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "PayloadCapacity",
                table: "Equipment");
        }
    }
}
