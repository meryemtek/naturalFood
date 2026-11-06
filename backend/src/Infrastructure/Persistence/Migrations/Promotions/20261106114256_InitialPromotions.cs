using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations.Promotions
{
    /// <inheritdoc />
    public partial class InitialPromotions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "promotions");

            migrationBuilder.CreateTable(
                name: "Coupons",
                schema: "promotions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DiscountType = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumSubtotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StartsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsageLimit = table.Column<int>(type: "integer", nullable: true),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coupons", x => x.Id);
                    table.CheckConstraint("CK_coupon_code", "\"Code\" = upper(\"Code\") AND length(\"Code\") BETWEEN 1 AND 64");
                    table.CheckConstraint("CK_coupon_dates", "\"EndsAtUtc\" IS NULL OR \"StartsAtUtc\" IS NULL OR \"EndsAtUtc\" > \"StartsAtUtc\"");
                    table.CheckConstraint("CK_coupon_discount", "(\"DiscountType\" = 'Percent' AND \"DiscountValue\" > 0 AND \"DiscountValue\" <= 100) OR (\"DiscountType\" = 'Fixed' AND \"DiscountValue\" > 0)");
                    table.CheckConstraint("CK_coupon_limits", "\"MinimumSubtotal\" >= 0 AND \"UsageCount\" >= 0 AND (\"UsageLimit\" IS NULL OR (\"UsageLimit\" > 0 AND \"UsageCount\" <= \"UsageLimit\"))");
                    table.CheckConstraint("CK_coupon_scope", "NOT (\"ProductId\" IS NOT NULL AND \"CategoryId\" IS NOT NULL)");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_Code",
                schema: "promotions",
                table: "Coupons",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Coupons",
                schema: "promotions");
        }
    }
}
