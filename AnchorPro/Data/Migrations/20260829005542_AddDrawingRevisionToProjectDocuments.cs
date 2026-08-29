using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDrawingRevisionToProjectDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BoqSectionId",
                table: "ProjectDocuments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "ProjectDocuments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RevisionNumber",
                table: "ProjectDocuments",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectDocuments_BoqSectionId",
                table: "ProjectDocuments",
                column: "BoqSectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectDocuments_BoqSections_BoqSectionId",
                table: "ProjectDocuments",
                column: "BoqSectionId",
                principalTable: "BoqSections",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectDocuments_BoqSections_BoqSectionId",
                table: "ProjectDocuments");

            migrationBuilder.DropIndex(
                name: "IX_ProjectDocuments_BoqSectionId",
                table: "ProjectDocuments");

            migrationBuilder.DropColumn(
                name: "BoqSectionId",
                table: "ProjectDocuments");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "ProjectDocuments");

            migrationBuilder.DropColumn(
                name: "RevisionNumber",
                table: "ProjectDocuments");
        }
    }
}
