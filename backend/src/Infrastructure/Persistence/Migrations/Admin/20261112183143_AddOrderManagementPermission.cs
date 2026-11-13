using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations.Admin
{
    /// <inheritdoc />
    public partial class AddOrderManagementPermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "admin",
                table: "ModulePermissions",
                columns: new[] { "Id", "Category", "Key", "Title" },
                values: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10"), "Sipariş & Lojistik", "orders.manage", "Sipariş Durumu ve Talepleri Yönetme" });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "RolePermissions",
                columns: new[] { "PermissionKey", "RoleId" },
                values: new object[,]
                {
                    { "orders.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "orders.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "admin",
                table: "RolePermissions",
                keyColumns: new[] { "PermissionKey", "RoleId" },
                keyValues: new object[] { "orders.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") });

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "RolePermissions",
                keyColumns: new[] { "PermissionKey", "RoleId" },
                keyValues: new object[] { "orders.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2") });

            migrationBuilder.DeleteData(
                schema: "admin",
                table: "ModulePermissions",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10"));
        }
    }
}
