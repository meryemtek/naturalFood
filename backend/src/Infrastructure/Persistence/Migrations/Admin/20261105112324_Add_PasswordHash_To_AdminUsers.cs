using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations.Admin
{
    /// <inheritdoc />
    public partial class Add_PasswordHash_To_AdminUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                schema: "admin",
                table: "AdminUsers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                schema: "admin",
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "PasswordHash",
                value: "dGVzdHNhbHQxMjM0NTY3OA==.2YVj2w+Y1924k87hF06gKjZJ8N9c1kL4A7VzE1s5D8Q=");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordHash",
                schema: "admin",
                table: "AdminUsers");
        }
    }
}

