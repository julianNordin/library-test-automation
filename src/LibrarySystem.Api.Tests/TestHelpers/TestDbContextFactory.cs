using LibrarySystem.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LibrarySystem.Api.Tests.TestHelpers;

public static class TestDbContextFactory
{
    public static AppDbContext Create()
    {
        // Each test gets its own uniquely named in-memory database - a shared/fixed name
        // let earlier tests' data leak into later ones (EF Core InMemory keeps a named
        // database alive for the whole test run, not per-DbContext-instance).
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }
}
