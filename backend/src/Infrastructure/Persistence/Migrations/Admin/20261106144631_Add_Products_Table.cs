using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations.Admin
{
    /// <inheritdoc />
    public partial class Add_Products_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Products",
                schema: "admin",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    SKU = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Barcode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Category = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SaleUnit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BasePrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    SellingPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StockQuantity = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "Products",
                columns: new[] { "Id", "Barcode", "BasePrice", "Category", "CreatedAtUtc", "ImageUrl", "Name", "SKU", "SaleUnit", "SellingPrice", "Status", "StockQuantity", "UpdatedAtUtc" },
                values: new object[,]
                {
                    { new Guid("a1111111-1111-1111-1111-111111111111"), "8690123456012", 320.00m, "Zeytinyağı & Şarküteri", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Organik Soğuk Sıkım Sızma Zeytinyağı", "SKU-ORG-OIL-500", "Litre", 385.00m, "Active", 142.00m, null },
                    { new Guid("a2222222-2222-2222-2222-222222222222"), "8690123456029", 65.00m, "Un & Tahıl Grubu", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Taş Değirmen Organik Siyez Unu", "SKU-ORG-FLR-1000", "Kg", 84.50m, "Active", 320.00m, null },
                    { new Guid("a3333333-3333-3333-3333-333333333333"), "8690123456036", 175.00m, "Süt & Şarküteri", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Şirden Mayalı Trakya Eski Kaşar Peyniri", "SKU-CHZ-KAS-350", "Gramaj", 215.00m, "LowStock", 4.00m, null },
                    { new Guid("a4444444-4444-4444-4444-444444444444"), "8690123456043", 85.00m, "Kahvaltılık", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Gezen Tavuk Organik Köy Yumurtası (10'lu)", "SKU-EGG-VIL-10", "Adet", 110.00m, "LowStock", 2.00m, null }
                });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "Products",
                columns: new[] { "Id", "Barcode", "BasePrice", "Category", "CreatedAtUtc", "ImageUrl", "Name", "SKU", "SaleUnit", "SellingPrice", "Status", "UpdatedAtUtc" },
                values: new object[] { new Guid("a5555555-5555-5555-5555-555555555555"), "8690123456050", 130.00m, "Kuru Yemiş", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Ham Çiğ Fıstık & Badem Karışımı", "SKU-NUT-MIX-250", "Gramaj", 165.00m, "OutOfStock", null });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "Products",
                columns: new[] { "Id", "Barcode", "BasePrice", "Category", "CreatedAtUtc", "ImageUrl", "Name", "SKU", "SaleUnit", "SellingPrice", "Status", "StockQuantity", "UpdatedAtUtc" },
                values: new object[] { new Guid("a6666666-6666-6666-6666-666666666666"), "8690123456067", 240.00m, "Süt & Şarküteri", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Doğal Yayık Köy Tereyağı", "SKU-BTR-YAY-500", "Kg", 290.00m, "Active", 42.00m, null });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Barcode",
                schema: "admin",
                table: "Products",
                column: "Barcode",
                unique: true,
                filter: "\"Barcode\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SKU",
                schema: "admin",
                table: "Products",
                column: "SKU",
                unique: true,
                filter: "\"SKU\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Products",
                schema: "admin");
        }
    }
}
