using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations.Catalog
{
    /// <inheritdoc />
    public partial class Add_Product_Allergens_And_Nutrition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE catalog.\"Products\" ALTER COLUMN \"Allergens\" TYPE text[] USING CASE WHEN \"Allergens\" IS NULL OR \"Allergens\" = '' THEN ARRAY[]::text[] ELSE ARRAY[\"Allergens\"] END;");
            migrationBuilder.Sql("ALTER TABLE catalog.\"Products\" ALTER COLUMN \"Allergens\" SET NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE catalog.\"Products\" ALTER COLUMN \"Allergens\" SET DEFAULT ARRAY[]::text[];");

            migrationBuilder.AddColumn<List<string>>(
                name: "Certifications",
                schema: "catalog",
                table: "Products",
                type: "text[]",
                nullable: false,
                defaultValueSql: "ARRAY[]::text[]");

            migrationBuilder.AddColumn<string>(
                name: "NutritionalValues",
                schema: "catalog",
                table: "Products",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Certifications",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NutritionalValues",
                schema: "catalog",
                table: "Products");

            migrationBuilder.Sql("ALTER TABLE catalog.\"Products\" ALTER COLUMN \"Allergens\" TYPE character varying(1000) USING array_to_string(\"Allergens\", ', ');");
            migrationBuilder.Sql("ALTER TABLE catalog.\"Products\" ALTER COLUMN \"Allergens\" DROP NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE catalog.\"Products\" ALTER COLUMN \"Allergens\" DROP DEFAULT;");
        }
    }
}
