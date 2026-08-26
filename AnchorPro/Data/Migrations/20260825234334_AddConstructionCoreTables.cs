using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConstructionCoreTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillsOfQuantities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    TotalContractSum = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ApprovedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillsOfQuantities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillsOfQuantities_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BillsOfQuantities_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteDiaryEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    DiaryDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    WeatherCondition = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TemperatureCelsius = table.Column<decimal>(type: "numeric", nullable: true),
                    WorkPerformedSummary = table.Column<string>(type: "text", nullable: false),
                    SiteInstructionsReceived = table.Column<string>(type: "text", nullable: true),
                    DelaysOrConstraints = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LoggedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ApprovedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiaryEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteDiaryEntries_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SiteDiaryEntries_AspNetUsers_LoggedById",
                        column: x => x.LoggedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SiteDiaryEntries_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoqSections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BillOfQuantitiesId = table.Column<int>(type: "integer", nullable: false),
                    SectionCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    SectionName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoqSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoqSections_BillsOfQuantities_BillOfQuantitiesId",
                        column: x => x.BillOfQuantitiesId,
                        principalTable: "BillsOfQuantities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaymentCertificates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    BillOfQuantitiesId = table.Column<int>(type: "integer", nullable: true),
                    CertificateNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PeriodStartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PeriodEndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    GrossValuationToDate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RetentionPercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    RetentionDeductionToDate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PreviousCertificatesPaid = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetAmountDue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ConsultantName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ConsultantNotes = table.Column<string>(type: "text", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ApprovedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentCertificates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentCertificates_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentCertificates_BillsOfQuantities_BillOfQuantitiesId",
                        column: x => x.BillOfQuantitiesId,
                        principalTable: "BillsOfQuantities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentCertificates_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteDiaryDeliveries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiteDiaryEntryId = table.Column<int>(type: "integer", nullable: false),
                    SupplierName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    MaterialDescription = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    QuantityReceived = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DeliveryNoteNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    VerifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiaryDeliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteDiaryDeliveries_SiteDiaryEntries_SiteDiaryEntryId",
                        column: x => x.SiteDiaryEntryId,
                        principalTable: "SiteDiaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteDiaryLabours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiteDiaryEntryId = table.Column<int>(type: "integer", nullable: false),
                    TradeOrCrewName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Headcount = table.Column<int>(type: "integer", nullable: false),
                    HoursWorked = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiaryLabours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteDiaryLabours_SiteDiaryEntries_SiteDiaryEntryId",
                        column: x => x.SiteDiaryEntryId,
                        principalTable: "SiteDiaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteDiaryPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiteDiaryEntryId = table.Column<int>(type: "integer", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: false),
                    Caption = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    TakenAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UploadedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiaryPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteDiaryPhotos_AspNetUsers_UploadedById",
                        column: x => x.UploadedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SiteDiaryPhotos_SiteDiaryEntries_SiteDiaryEntryId",
                        column: x => x.SiteDiaryEntryId,
                        principalTable: "SiteDiaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteDiaryPlants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiteDiaryEntryId = table.Column<int>(type: "integer", nullable: false),
                    EquipmentId = table.Column<int>(type: "integer", nullable: true),
                    EquipmentName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    OperatingHours = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    IdleHours = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    BreakdownHours = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    FuelConsumedLitres = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiaryPlants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteDiaryPlants_Equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipment",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SiteDiaryPlants_SiteDiaryEntries_SiteDiaryEntryId",
                        column: x => x.SiteDiaryEntryId,
                        principalTable: "SiteDiaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteDiarySafeties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SiteDiaryEntryId = table.Column<int>(type: "integer", nullable: false),
                    ToolboxTalkTopic = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IncidentsReported = table.Column<int>(type: "integer", nullable: false),
                    NearMissesCount = table.Column<int>(type: "integer", nullable: false),
                    HazardsIdentified = table.Column<string>(type: "text", nullable: true),
                    CorrectiveAction = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteDiarySafeties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteDiarySafeties_SiteDiaryEntries_SiteDiaryEntryId",
                        column: x => x.SiteDiaryEntryId,
                        principalTable: "SiteDiaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoqItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BoqSectionId = table.Column<int>(type: "integer", nullable: false),
                    ItemNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    Rate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoqItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoqItems_BoqSections_BoqSectionId",
                        column: x => x.BoqSectionId,
                        principalTable: "BoqSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaymentCertificateItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PaymentCertificateId = table.Column<int>(type: "integer", nullable: false),
                    BoqItemId = table.Column<int>(type: "integer", nullable: false),
                    PreviousQuantity = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    CurrentQuantityCompleted = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    CumulativeQuantityCompleted = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    CumulativeValueCompleted = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PercentageComplete = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentCertificateItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentCertificateItems_BoqItems_BoqItemId",
                        column: x => x.BoqItemId,
                        principalTable: "BoqItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PaymentCertificateItems_PaymentCertificates_PaymentCertific~",
                        column: x => x.PaymentCertificateId,
                        principalTable: "PaymentCertificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Variations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    VariationNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    BoqItemId = table.Column<int>(type: "integer", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ApprovedById = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(85)", maxLength: 85, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Variations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Variations_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Variations_BoqItems_BoqItemId",
                        column: x => x.BoqItemId,
                        principalTable: "BoqItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Variations_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillsOfQuantities_ApprovedById",
                table: "BillsOfQuantities",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_BillsOfQuantities_ProjectId",
                table: "BillsOfQuantities",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_BoqItems_BoqSectionId",
                table: "BoqItems",
                column: "BoqSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_BoqSections_BillOfQuantitiesId",
                table: "BoqSections",
                column: "BillOfQuantitiesId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificateItems_BoqItemId",
                table: "PaymentCertificateItems",
                column: "BoqItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificateItems_PaymentCertificateId",
                table: "PaymentCertificateItems",
                column: "PaymentCertificateId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificates_ApprovedById",
                table: "PaymentCertificates",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificates_BillOfQuantitiesId",
                table: "PaymentCertificates",
                column: "BillOfQuantitiesId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCertificates_ProjectId",
                table: "PaymentCertificates",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryDeliveries_SiteDiaryEntryId",
                table: "SiteDiaryDeliveries",
                column: "SiteDiaryEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryEntries_ApprovedById",
                table: "SiteDiaryEntries",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryEntries_LoggedById",
                table: "SiteDiaryEntries",
                column: "LoggedById");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryEntries_ProjectId",
                table: "SiteDiaryEntries",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryLabours_SiteDiaryEntryId",
                table: "SiteDiaryLabours",
                column: "SiteDiaryEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryPhotos_SiteDiaryEntryId",
                table: "SiteDiaryPhotos",
                column: "SiteDiaryEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryPhotos_UploadedById",
                table: "SiteDiaryPhotos",
                column: "UploadedById");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryPlants_EquipmentId",
                table: "SiteDiaryPlants",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiaryPlants_SiteDiaryEntryId",
                table: "SiteDiaryPlants",
                column: "SiteDiaryEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteDiarySafeties_SiteDiaryEntryId",
                table: "SiteDiarySafeties",
                column: "SiteDiaryEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_Variations_ApprovedById",
                table: "Variations",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_Variations_BoqItemId",
                table: "Variations",
                column: "BoqItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Variations_ProjectId",
                table: "Variations",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentCertificateItems");

            migrationBuilder.DropTable(
                name: "SiteDiaryDeliveries");

            migrationBuilder.DropTable(
                name: "SiteDiaryLabours");

            migrationBuilder.DropTable(
                name: "SiteDiaryPhotos");

            migrationBuilder.DropTable(
                name: "SiteDiaryPlants");

            migrationBuilder.DropTable(
                name: "SiteDiarySafeties");

            migrationBuilder.DropTable(
                name: "Variations");

            migrationBuilder.DropTable(
                name: "PaymentCertificates");

            migrationBuilder.DropTable(
                name: "SiteDiaryEntries");

            migrationBuilder.DropTable(
                name: "BoqItems");

            migrationBuilder.DropTable(
                name: "BoqSections");

            migrationBuilder.DropTable(
                name: "BillsOfQuantities");
        }
    }
}
