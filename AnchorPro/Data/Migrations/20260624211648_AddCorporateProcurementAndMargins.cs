using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCorporateProcurementAndMargins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PurchaseRequisitionId",
                table: "PurchaseOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedLaborHours",
                table: "JobCards",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "PurchaseRequisitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RequisitionNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    JobCardId = table.Column<int>(type: "integer", nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: true),
                    RequestedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: false),
                    RequiredDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ApprovedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    ApprovedDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalEstimatedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseRequisitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_AspNetUsers_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_JobCards_JobCardId",
                        column: x => x.JobCardId,
                        principalTable: "JobCards",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PurchaseRequisitionItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PurchaseRequisitionId = table.Column<int>(type: "integer", nullable: false),
                    InventoryItemId = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    QuantityRequested = table.Column<int>(type: "integer", nullable: false),
                    EstimatedUnitCost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LineTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseRequisitionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitionItems_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitionItems_PurchaseRequisitions_PurchaseRequi~",
                        column: x => x.PurchaseRequisitionId,
                        principalTable: "PurchaseRequisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_PurchaseRequisitionId",
                table: "PurchaseOrders",
                column: "PurchaseRequisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitionItems_InventoryItemId",
                table: "PurchaseRequisitionItems",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitionItems_PurchaseRequisitionId",
                table: "PurchaseRequisitionItems",
                column: "PurchaseRequisitionId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_ApprovedById",
                table: "PurchaseRequisitions",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_DepartmentId",
                table: "PurchaseRequisitions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_JobCardId",
                table: "PurchaseRequisitions",
                column: "JobCardId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_RequestedById",
                table: "PurchaseRequisitions",
                column: "RequestedById");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_PurchaseRequisitions_PurchaseRequisitionId",
                table: "PurchaseOrders",
                column: "PurchaseRequisitionId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_PurchaseRequisitions_PurchaseRequisitionId",
                table: "PurchaseOrders");

            migrationBuilder.DropTable(
                name: "PurchaseRequisitionItems");

            migrationBuilder.DropTable(
                name: "PurchaseRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_PurchaseRequisitionId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "PurchaseRequisitionId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "EstimatedLaborHours",
                table: "JobCards");
        }
    }
}
