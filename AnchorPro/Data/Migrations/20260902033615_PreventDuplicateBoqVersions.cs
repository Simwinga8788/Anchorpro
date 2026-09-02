using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class PreventDuplicateBoqVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BillsOfQuantities_ProjectId",
                table: "BillsOfQuantities");

            migrationBuilder.CreateIndex(
                name: "IX_BillsOfQuantities_ProjectId_VersionNumber",
                table: "BillsOfQuantities",
                columns: new[] { "ProjectId", "VersionNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BillsOfQuantities_ProjectId_VersionNumber",
                table: "BillsOfQuantities");

            migrationBuilder.CreateIndex(
                name: "IX_BillsOfQuantities_ProjectId",
                table: "BillsOfQuantities",
                column: "ProjectId");
        }
    }
}
