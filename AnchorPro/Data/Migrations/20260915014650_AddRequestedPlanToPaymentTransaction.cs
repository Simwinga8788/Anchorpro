using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnchorPro.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestedPlanToPaymentTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RequestedPlanId",
                table: "Payments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_RequestedPlanId",
                table: "Payments",
                column: "RequestedPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_SubscriptionPlans_RequestedPlanId",
                table: "Payments",
                column: "RequestedPlanId",
                principalTable: "SubscriptionPlans",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_SubscriptionPlans_RequestedPlanId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_RequestedPlanId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "RequestedPlanId",
                table: "Payments");
        }
    }
}
