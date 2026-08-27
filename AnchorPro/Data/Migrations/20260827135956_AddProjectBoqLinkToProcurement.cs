using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectBoqLinkToProcurement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "PurchaseRequisitions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BoqItemId",
                table: "PurchaseRequisitionItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "PurchaseOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BoqItemId",
                table: "PurchaseOrderItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_ProjectId",
                table: "PurchaseRequisitions",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitionItems_BoqItemId",
                table: "PurchaseRequisitionItems",
                column: "BoqItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_ProjectId",
                table: "PurchaseOrders",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_BoqItemId",
                table: "PurchaseOrderItems",
                column: "BoqItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_BoqItems_BoqItemId",
                table: "PurchaseOrderItems",
                column: "BoqItemId",
                principalTable: "BoqItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Projects_ProjectId",
                table: "PurchaseOrders",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseRequisitionItems_BoqItems_BoqItemId",
                table: "PurchaseRequisitionItems",
                column: "BoqItemId",
                principalTable: "BoqItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseRequisitions_Projects_ProjectId",
                table: "PurchaseRequisitions",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_BoqItems_BoqItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Projects_ProjectId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseRequisitionItems_BoqItems_BoqItemId",
                table: "PurchaseRequisitionItems");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseRequisitions_Projects_ProjectId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseRequisitions_ProjectId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseRequisitionItems_BoqItemId",
                table: "PurchaseRequisitionItems");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_ProjectId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderItems_BoqItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropColumn(
                name: "BoqItemId",
                table: "PurchaseRequisitionItems");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "BoqItemId",
                table: "PurchaseOrderItems");
        }
    }
}
