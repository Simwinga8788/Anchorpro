using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificateLedgerLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PaymentCertificateId",
                table: "LedgerEntries",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LedgerEntries_PaymentCertificateId",
                table: "LedgerEntries",
                column: "PaymentCertificateId");

            migrationBuilder.AddForeignKey(
                name: "FK_LedgerEntries_PaymentCertificates_PaymentCertificateId",
                table: "LedgerEntries",
                column: "PaymentCertificateId",
                principalTable: "PaymentCertificates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LedgerEntries_PaymentCertificates_PaymentCertificateId",
                table: "LedgerEntries");

            migrationBuilder.DropIndex(
                name: "IX_LedgerEntries_PaymentCertificateId",
                table: "LedgerEntries");

            migrationBuilder.DropColumn(
                name: "PaymentCertificateId",
                table: "LedgerEntries");
        }
    }
}
