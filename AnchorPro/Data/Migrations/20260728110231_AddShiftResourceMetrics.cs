using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftResourceMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ActualQuantity",
                table: "ShiftResources",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuantityUnit",
                table: "ShiftResources",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualQuantity",
                table: "ShiftResources");

            migrationBuilder.DropColumn(
                name: "QuantityUnit",
                table: "ShiftResources");
        }
    }
}
