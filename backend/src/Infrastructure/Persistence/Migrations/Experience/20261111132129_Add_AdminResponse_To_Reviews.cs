using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations.Experience
{
    /// <inheritdoc />
    public partial class Add_AdminResponse_To_Reviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminResponse",
                schema: "experience",
                table: "Reviews",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RespondedAtUtc",
                schema: "experience",
                table: "Reviews",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminResponse",
                schema: "experience",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RespondedAtUtc",
                schema: "experience",
                table: "Reviews");
        }
    }
}
