using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectLinkToContract : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "Contracts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ProjectId",
                table: "Contracts",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Projects_ProjectId",
                table: "Contracts",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Projects_ProjectId",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_ProjectId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Contracts");
        }
    }
}
