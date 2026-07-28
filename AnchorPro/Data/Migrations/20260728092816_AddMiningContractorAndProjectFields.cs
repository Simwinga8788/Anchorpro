using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMiningContractorAndProjectFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContractorContractId",
                table: "ShiftProductionLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MiningActivity",
                table: "ShiftProductionLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ActualCost",
                table: "Projects",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Colour",
                table: "Projects",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompletionPercentage",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ContractPartyType",
                table: "Contracts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RateType",
                table: "Contracts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkingArea",
                table: "Contracts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftProductionLogs_ContractorContractId",
                table: "ShiftProductionLogs",
                column: "ContractorContractId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftProductionLogs_Contracts_ContractorContractId",
                table: "ShiftProductionLogs",
                column: "ContractorContractId",
                principalTable: "Contracts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftProductionLogs_Contracts_ContractorContractId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropIndex(
                name: "IX_ShiftProductionLogs_ContractorContractId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "ContractorContractId",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "MiningActivity",
                table: "ShiftProductionLogs");

            migrationBuilder.DropColumn(
                name: "ActualCost",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Colour",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CompletionPercentage",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ContractPartyType",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "RateType",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "WorkingArea",
                table: "Contracts");
        }
    }
}
