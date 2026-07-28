using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftResourcesAndClientLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClientContractId",
                table: "ShiftProductionLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Material",
                table: "ShiftProductionLogs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ShiftResources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShiftProductionLogId = table.Column<int>(type: "integer", nullable: false),
                    EquipmentId = table.Column<int>(type: "integer", nullable: true),
                    OperatorId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OperatingHours = table.Column<decimal>(type: "numeric", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftResources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftResources_AspNetUsers_OperatorId",
                        column: x => x.OperatorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ShiftResources_Equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipment",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ShiftResources_ShiftProductionLogs_ShiftProductionLogId",
                        column: x => x.ShiftProductionLogId,
                        principalTable: "ShiftProductionLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftProductionLogs_ClientContractId",
                table: "ShiftProductionLogs",
                column: "ClientContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftResources_EquipmentId",
                table: "ShiftResources",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftResources_OperatorId",
                table: "ShiftResources",
                column: "OperatorId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftResources_ShiftProductionLogId",
                table: "ShiftResources",
                column: "ShiftProductionLogId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftProductionLogs_Contracts_ClientContractId",
                table: "ShiftProductionLogs",
                column: "ClientContractId",
                principalTable: "Contracts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftProductionLogs_Contracts_ClientContractId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropTable(
                name: "ShiftResources");

            migrationBuilder.DropIndex(
                name: "IX_ShiftProductionLogs_ClientContractId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "ClientContractId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "Material",
                table: "ShiftProductionLogs");
        }
    }
}
