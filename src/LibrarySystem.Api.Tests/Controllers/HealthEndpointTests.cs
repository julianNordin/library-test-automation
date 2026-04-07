using System.Net;
using LibrarySystem.Api.Tests.TestHelpers;
using Xunit;

namespace LibrarySystem.Api.Tests.Controllers;

public class HealthEndpointTests : IClassFixture<LibrarySystemApiFactory>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(LibrarySystemApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReportsHealthy_WhenTheDatabaseIsReachable()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }

    // The unhealthy path is deliberately not tested here, and that is worth explaining rather
    // than leaving as a gap.
    //
    // This harness swaps in the InMemory provider, whose CanConnect always succeeds, so there is
    // no way to make it fail that would prove anything. Pointing the harness at an unreachable
    // SQL Server does not work either: Program.cs calls Database.Migrate() during startup
    // without guarding it, so an unreachable database kills host construction before any request
    // is served - the test would fail, but for the wrong reason.
    //
    // Making startup survive that would be a change to the system under test in order to make a
    // test pass, which is the one thing this project does not do. The failure path was instead
    // verified against the real stack: with the database container stopped, /health returns
    // 503 Unhealthy, and returns to 200 Healthy once it is back, with no API restart.
}
