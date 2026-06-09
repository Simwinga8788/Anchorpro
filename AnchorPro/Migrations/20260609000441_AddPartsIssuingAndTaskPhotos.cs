using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Migrations
{
    /// <inheritdoc />
    public partial class AddPartsIssuingAndTaskPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhotoPath",
                table: "JobTasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsIssued",
                table: "JobCardParts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoPath",
                table: "JobTasks");

            migrationBuilder.DropColumn(
                name: "IsIssued",
                table: "JobCardParts");
        }
    }
}
