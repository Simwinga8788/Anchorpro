using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectLinkToSafetyPermits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermitsToWork_JobCards_JobCardId",
                table: "PermitsToWork");

            migrationBuilder.AlterColumn<int>(
                name: "JobCardId",
                table: "PermitsToWork",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "PermitsToWork",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ActivePermitsCount",
                table: "MonthlyReports",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "PermitCompliancePercent",
                table: "MonthlyReports",
                type: "numeric(5,1)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_PermitsToWork_ProjectId",
                table: "PermitsToWork",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_PermitsToWork_JobCards_JobCardId",
                table: "PermitsToWork",
                column: "JobCardId",
                principalTable: "JobCards",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PermitsToWork_Projects_ProjectId",
                table: "PermitsToWork",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermitsToWork_JobCards_JobCardId",
                table: "PermitsToWork");

            migrationBuilder.DropForeignKey(
                name: "FK_PermitsToWork_Projects_ProjectId",
                table: "PermitsToWork");

            migrationBuilder.DropIndex(
                name: "IX_PermitsToWork_ProjectId",
                table: "PermitsToWork");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "PermitsToWork");

            migrationBuilder.DropColumn(
                name: "ActivePermitsCount",
                table: "MonthlyReports");

            migrationBuilder.DropColumn(
                name: "PermitCompliancePercent",
                table: "MonthlyReports");

            migrationBuilder.AlterColumn<int>(
                name: "JobCardId",
                table: "PermitsToWork",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PermitsToWork_JobCards_JobCardId",
                table: "PermitsToWork",
                column: "JobCardId",
                principalTable: "JobCards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
