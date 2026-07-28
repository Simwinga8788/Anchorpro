using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftResourceDowntime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DowntimeHours",
                table: "ShiftResources",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DowntimeReason",
                table: "ShiftResources",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DowntimeHours",
                table: "ShiftResources");

            migrationBuilder.DropColumn(
                name: "DowntimeReason",
                table: "ShiftResources");
        }
    }
}
