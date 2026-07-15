using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionBillingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InvoiceId",
                table: "ShiftProductionLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitOfMeasure",
                table: "Contracts",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitRate",
                table: "Contracts",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftProductionLogs_InvoiceId",
                table: "ShiftProductionLogs",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftProductionLogs_Invoices_InvoiceId",
                table: "ShiftProductionLogs",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftProductionLogs_Invoices_InvoiceId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropIndex(
                name: "IX_ShiftProductionLogs_InvoiceId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasure",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "UnitRate",
                table: "Contracts");
        }
    }
}
