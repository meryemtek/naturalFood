using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations.Admin
{
    /// <inheritdoc />
    public partial class Seed_Remaining_Module_Permissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "admin",
                table: "ModulePermissions",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7"),
                column: "Title",
                value: "Kullanıcı, Rol ve Sistem Ayarları");

            migrationBuilder.InsertData(
                schema: "admin",
                table: "ModulePermissions",
                columns: new[] { "Id", "Category", "Key", "Title" },
                values: new object[,]
                {
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8"), "Müşteri İlişkileri", "crm.manage", "Müşteri Listesi, Segmentler ve Destek Biletleri" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9"), "Pazarlama & Kampanya", "marketing.view", "Pazarlama, Kampanya ve Sadakat Yönetimi" }
                });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "RolePermissions",
                columns: new[] { "PermissionKey", "RoleId" },
                values: new object[,]
                {
                    { "crm.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "marketing.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "admin",
                table: "RolePermissions",
                keyColumns: new[] { "PermissionKey", "RoleId" },
                keyValues: new object[] { "crm.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") });

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "RolePermissions",
                keyColumns: new[] { "PermissionKey", "RoleId" },
                keyValues: new object[] { "marketing.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") });

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "ModulePermissions",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8"));

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "ModulePermissions",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9"));

            migrationBuilder.UpdateData(
                schema: "admin",
                table: "ModulePermissions",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7"),
                column: "Title",
                value: "Kullanıcı ve Rol Yetki Yönetimi");
        }
    }
}
