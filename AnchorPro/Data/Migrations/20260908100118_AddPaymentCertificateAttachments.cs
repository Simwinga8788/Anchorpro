using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentCertificateAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentCertificatePhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PaymentCertificateId = table.Column<int>(type: "integer", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: false),
                    Caption = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UploadedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentCertificatePhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentCertificatePhotos_AspNetUsers_UploadedById",
                        column: x => x.UploadedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentCertificatePhotos_PaymentCertificates_PaymentCertifi~",
                        column: x => x.PaymentCertificateId,
                        principalTable: "PaymentCertificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificatePhotos_PaymentCertificateId",
                table: "PaymentCertificatePhotos",
                column: "PaymentCertificateId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificatePhotos_UploadedById",
                table: "PaymentCertificatePhotos",
                column: "UploadedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentCertificatePhotos");
        }
    }
}
