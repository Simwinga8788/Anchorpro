using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteDiaryScheduleEvidenceLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteDiaryEntryMilestoneLinks",
                columns: table => new
                {
                    DiaryEntriesId = table.Column<int>(type: "integer", nullable: false),
                    LinkedActivitiesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiaryEntryMilestoneLinks", x => new { x.DiaryEntriesId, x.LinkedActivitiesId });
                    table.ForeignKey(
                        name: "FK_SiteDiaryEntryMilestoneLinks_ProjectMilestones_LinkedActivi~",
                        column: x => x.LinkedActivitiesId,
                        principalTable: "ProjectMilestones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SiteDiaryEntryMilestoneLinks_SiteDiaryEntries_DiaryEntriesId",
                        column: x => x.DiaryEntriesId,
                        principalTable: "SiteDiaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryEntryMilestoneLinks_LinkedActivitiesId",
                table: "SiteDiaryEntryMilestoneLinks",
                column: "LinkedActivitiesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SiteDiaryEntryMilestoneLinks");
        }
    }
}
