using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBoqSectionLinkToScheduleActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BoqSectionId",
                table: "ProjectMilestones",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMilestones_BoqSectionId",
                table: "ProjectMilestones",
                column: "BoqSectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectMilestones_BoqSections_BoqSectionId",
                table: "ProjectMilestones",
                column: "BoqSectionId",
                principalTable: "BoqSections",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectMilestones_BoqSections_BoqSectionId",
                table: "ProjectMilestones");

            migrationBuilder.DropIndex(
                name: "IX_ProjectMilestones_BoqSectionId",
                table: "ProjectMilestones");

            migrationBuilder.DropColumn(
                name: "BoqSectionId",
                table: "ProjectMilestones");
        }
    }
}
