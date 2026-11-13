using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations.Orders
{
    /// <inheritdoc />
    public partial class AddOrderWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TrackingUrl",
                schema: "orders",
                table: "Shipments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomerRequests",
                schema: "orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Response = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerRequests_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "orders",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                schema: "orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IssuedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "orders",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                schema: "orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Channel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Message = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "orders",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StatusEvents",
                schema: "orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatusEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatusEvents_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "orders",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRequests_OrderId_Kind",
                schema: "orders",
                table: "CustomerRequests",
                columns: new[] { "OrderId", "Kind" },
                unique: true,
                filter: "\"Status\" = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_OrderId",
                schema: "orders",
                table: "Invoices",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_EventId_Channel",
                schema: "orders",
                table: "Notifications",
                columns: new[] { "EventId", "Channel" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_OrderId",
                schema: "orders",
                table: "Notifications",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusEvents_OrderId_CreatedAtUtc",
                schema: "orders",
                table: "StatusEvents",
                columns: new[] { "OrderId", "CreatedAtUtc" });
            migrationBuilder.Sql("""
                INSERT INTO orders."StatusEvents" ("Id", "OrderId", "Status", "Note", "ActorId", "CreatedAtUtc")
                SELECT gen_random_uuid(), "Id", "Status", 'Takip geçmişi etkinleştirildi. Bu kayıt siparişin mevcut durumunu gösterir.', NULL, NOW()
                FROM orders."Orders";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerRequests",
                schema: "orders");

            migrationBuilder.DropTable(
                name: "Invoices",
                schema: "orders");

            migrationBuilder.DropTable(
                name: "Notifications",
                schema: "orders");

            migrationBuilder.DropTable(
                name: "StatusEvents",
                schema: "orders");

            migrationBuilder.DropColumn(
                name: "TrackingUrl",
                schema: "orders",
                table: "Shipments");
        }
    }
}
