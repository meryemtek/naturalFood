using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations.Admin
{
    /// <inheritdoc />
    public partial class Seed_AdminUsers_And_CustomRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomRoleName",
                schema: "admin",
                table: "AdminUsers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                schema: "admin",
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "CustomRoleName",
                value: null);

            migrationBuilder.InsertData(
                schema: "admin",
                table: "AdminUsers",
                columns: new[] { "Id", "CreatedAtUtc", "CustomRoleName", "Email", "FullName", "IsActive", "LastLoginAtUtc", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111112"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "superadmin@naturalfood.local", "Süper Yönetici", true, null, "TmF0dXJhbEZvb2RTYWx0MQ==.+uX/EkfMITMSbJleGGUXLsXLb3dNarW44H5g4Xks7I0=", "SuperAdmin" },
                    { new Guid("11111111-1111-1111-1111-111111111113"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "sube.muduru@naturalfood.local", "Ayşe Kaya (Şube Müdürü)", true, null, "TmF0dXJhbEZvb2RTYWx0Mg==./aqDXCzLl7Y+D5ZPqpiCsM1Cc67ItgkQwU5oPR0hOzs=", "BranchManager" },
                    { new Guid("11111111-1111-1111-1111-111111111114"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "depo@naturalfood.local", "Mehmet Yılmaz (Depo Personeli)", true, null, "TmF0dXJhbEZvb2RTYWx0Mw==.K1NnRkI8m5l7MWfy8PiGbvkcKDmyuQIjoofEMCcrEPU=", "WarehouseStaff" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "admin",
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111112"));

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111113"));

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111114"));

            migrationBuilder.DropColumn(
                name: "CustomRoleName",
                schema: "admin",
                table: "AdminUsers");
        }
    }
}
