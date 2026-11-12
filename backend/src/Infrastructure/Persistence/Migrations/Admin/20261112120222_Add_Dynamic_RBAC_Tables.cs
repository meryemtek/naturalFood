using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations.Admin
{
    /// <inheritdoc />
    public partial class Add_Dynamic_RBAC_Tables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModulePermissions",
                schema: "admin",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModulePermissions", x => x.Id);
                    table.UniqueConstraint("AK_ModulePermissions_Key", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                schema: "admin",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                schema: "admin",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionKey = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionKey });
                    table.ForeignKey(
                        name: "FK_RolePermissions_ModulePermissions_PermissionKey",
                        column: x => x.PermissionKey,
                        principalSchema: "admin",
                        principalTable: "ModulePermissions",
                        principalColumn: "Key",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "admin",
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "ModulePermissions",
                columns: new[] { "Id", "Category", "Key", "Title" },
                values: new object[,]
                {
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"), "Katalog & Ürün", "products.view", "Ürün ve Menü Yönetimi" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2"), "Stok & Depo", "inventory.view", "Stok ve Envanter Yönetimi" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3"), "Stok & Depo", "storage.view", "Depo ve Saklama Koşulları" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4"), "Müşteri İlişkileri", "crm.reviews", "Müşteri Değerlendirmeleri (CRM)" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5"), "Analitik & Finans", "finance.reports", "Finans / Ciro ve Satış Raporları" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6"), "Sipariş & Lojistik", "orders.view", "Sipariş ve Sevkiyat İşlemleri" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7"), "Sistem & Güvenlik", "users.manage", "Kullanıcı ve Rol Yetki Yönetimi" }
                });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "Roles",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"), "Süper Yönetici — Tüm sistem modüllerine sınırsız erişim (Bypass)", "SuperAdmin" },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"), "Şube Müdürü — Stok, ürün ve sipariş yönetimi yetkili; finans/ciro ve CRM izinleri dinamik yönetilir", "BranchManager" },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"), "Depo Personeli — Stok, envanter ve saklama koşulları modülleri", "WarehouseStaff" }
                });

            migrationBuilder.InsertData(
                schema: "admin",
                table: "RolePermissions",
                columns: new[] { "PermissionKey", "RoleId" },
                values: new object[,]
                {
                    { "crm.reviews", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "finance.reports", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "inventory.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "orders.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "products.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "storage.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "users.manage", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1") },
                    { "inventory.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2") },
                    { "orders.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2") },
                    { "products.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2") },
                    { "storage.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2") },
                    { "inventory.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3") },
                    { "storage.view", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModulePermissions_Key",
                schema: "admin",
                table: "ModulePermissions",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionKey",
                schema: "admin",
                table: "RolePermissions",
                column: "PermissionKey");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                schema: "admin",
                table: "Roles",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RolePermissions",
                schema: "admin");

            migrationBuilder.DropTable(
                name: "ModulePermissions",
                schema: "admin");

            migrationBuilder.DropTable(
                name: "Roles",
                schema: "admin");

        }
    }
}
