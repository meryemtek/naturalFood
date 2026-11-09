using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations.Catalog
{
    /// <inheritdoc />
    public partial class Add_Storage_Conditions_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShelfLocation",
                schema: "catalog",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StorageConditionId",
                schema: "catalog",
                table: "Products",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StorageConditions",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    MinTemperature = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    MaxTemperature = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    MaxHumidity = table.Column<int>(type: "integer", nullable: true),
                    RequiresColdChain = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DefaultShelfZone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageConditions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_StorageConditionId",
                schema: "catalog",
                table: "Products",
                column: "StorageConditionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_StorageConditions_StorageConditionId",
                schema: "catalog",
                table: "Products",
                column: "StorageConditionId",
                principalSchema: "catalog",
                principalTable: "StorageConditions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_StorageConditions_StorageConditionId",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropTable(
                name: "StorageConditions",
                schema: "catalog");

            migrationBuilder.DropIndex(
                name: "IX_Products_StorageConditionId",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShelfLocation",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StorageConditionId",
                schema: "catalog",
                table: "Products");
        }
    }
}
