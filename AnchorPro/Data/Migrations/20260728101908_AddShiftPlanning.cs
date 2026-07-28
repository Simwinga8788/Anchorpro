using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShiftPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlanDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Shift = table.Column<int>(type: "integer", nullable: false),
                    MineCaptainId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ShiftBossId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    OverallTargetTonnage = table.Column<decimal>(type: "numeric", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftPlans_AspNetUsers_MineCaptainId",
                        column: x => x.MineCaptainId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ShiftPlans_AspNetUsers_ShiftBossId",
                        column: x => x.ShiftBossId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ShiftPlanTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShiftPlanId = table.Column<int>(type: "integer", nullable: false),
                    ActivityCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EquipmentId = table.Column<int>(type: "integer", nullable: true),
                    OperatorId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    TargetPrimary = table.Column<decimal>(type: "numeric", nullable: true),
                    TargetPrimaryUnit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TargetTonnage = table.Column<decimal>(type: "numeric", nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DrillRingAndHole = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AssignedTrucks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Remarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftPlanTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftPlanTasks_AspNetUsers_OperatorId",
                        column: x => x.OperatorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ShiftPlanTasks_Equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipment",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ShiftPlanTasks_ShiftPlans_ShiftPlanId",
                        column: x => x.ShiftPlanId,
                        principalTable: "ShiftPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlans_MineCaptainId",
                table: "ShiftPlans",
                column: "MineCaptainId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlans_ShiftBossId",
                table: "ShiftPlans",
                column: "ShiftBossId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlanTasks_EquipmentId",
                table: "ShiftPlanTasks",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlanTasks_OperatorId",
                table: "ShiftPlanTasks",
                column: "OperatorId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPlanTasks_ShiftPlanId",
                table: "ShiftPlanTasks",
                column: "ShiftPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShiftPlanTasks");

            migrationBuilder.DropTable(
                name: "ShiftPlans");
        }
    }
}
