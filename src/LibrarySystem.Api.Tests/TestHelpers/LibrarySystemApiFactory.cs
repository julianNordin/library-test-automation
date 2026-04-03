using LibrarySystem.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LibrarySystem.Api.Tests.TestHelpers;

public class LibrarySystemApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // AddDbContext registers both DbContextOptions<AppDbContext> and a separate
            // IDbContextOptionsConfiguration<AppDbContext> (EF Core layers configuration
            // across multiple AddDbContext calls by design). Removing only the former
            // leaves Program.cs's UseSqlServer(...) callback registered too, so both
            // providers end up configured on the same options - remove every descriptor
            // that closes over AppDbContext before adding the InMemory one.
            var descriptorsToRemove = services
                .Where(d => d.ServiceType.IsGenericType
                    && d.ServiceType.GenericTypeArguments.Contains(typeof(AppDbContext)))
                .ToList();

            foreach (var descriptor in descriptorsToRemove)
            {
                services.Remove(descriptor);
            }

            // Captured once here, not generated inside the lambda below - the lambda
            // re-runs on every new scope (i.e. every HTTP request), so evaluating
            // Guid.NewGuid() there would hand each request its own fresh, empty database.
            var databaseName = Guid.NewGuid().ToString();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(databaseName));
        });
    }
}
