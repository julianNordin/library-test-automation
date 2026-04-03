using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LibrarySystem.Api.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Books",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Author = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Isbn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                PublicationYear = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Books", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Members",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                JoinedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Members", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Loans",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BookId = table.Column<int>(type: "int", nullable: false),
                MemberId = table.Column<int>(type: "int", nullable: false),
                BorrowedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                ReturnedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Loans", x => x.Id);
                table.ForeignKey(
                    name: "FK_Loans_Books_BookId",
                    column: x => x.BookId,
                    principalTable: "Books",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Loans_Members_MemberId",
                    column: x => x.MemberId,
                    principalTable: "Members",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Books_Isbn",
            table: "Books",
            column: "Isbn",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Loans_BookId",
            table: "Loans",
            column: "BookId");

        migrationBuilder.CreateIndex(
            name: "IX_Loans_MemberId",
            table: "Loans",
            column: "MemberId");

        migrationBuilder.CreateIndex(
            name: "IX_Members_Email",
            table: "Members",
            column: "Email",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Loans");

        migrationBuilder.DropTable(
            name: "Books");

        migrationBuilder.DropTable(
            name: "Members");
    }
}
