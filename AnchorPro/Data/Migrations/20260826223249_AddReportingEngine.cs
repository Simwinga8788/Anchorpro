using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReportingEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MonthlyReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    ReportYear = table.Column<int>(type: "integer", nullable: false),
                    ReportMonth = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OriginalContractSum = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    GrossValuationToDate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetCertifiedPayable = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LatestCertificateNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SafetyIncidentsCount = table.Column<int>(type: "integer", nullable: false),
                    NearMissesCount = table.Column<int>(type: "integer", nullable: false),
                    Narrative = table.Column<string>(type: "text", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ApprovedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IssuedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlyReports_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MonthlyReports_AspNetUsers_IssuedById",
                        column: x => x.IssuedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MonthlyReports_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WeeklyReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    ReportNumber = table.Column<int>(type: "integer", nullable: false),
                    PeriodStartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PeriodEndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    TotalManHours = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    AverageDailyWorkforce = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    TotalPlantHours = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    WeatherDowntimeDays = table.Column<int>(type: "integer", nullable: false),
                    SafetyIncidentsCount = table.Column<int>(type: "integer", nullable: false),
                    NearMissesCount = table.Column<int>(type: "integer", nullable: false),
                    KeyWorksNarrative = table.Column<string>(type: "text", nullable: false),
                    LookaheadNarrative = table.Column<string>(type: "text", nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IssuedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeeklyReports_AspNetUsers_IssuedById",
                        column: x => x.IssuedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_WeeklyReports_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_ApprovedById",
                table: "MonthlyReports",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_IssuedById",
                table: "MonthlyReports",
                column: "IssuedById");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyReports_ProjectId",
                table: "MonthlyReports",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyReports_IssuedById",
                table: "WeeklyReports",
                column: "IssuedById");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyReports_ProjectId",
                table: "WeeklyReports",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MonthlyReports");

            migrationBuilder.DropTable(
                name: "WeeklyReports");
        }
    }
}
