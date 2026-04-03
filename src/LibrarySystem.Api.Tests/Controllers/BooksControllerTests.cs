using System.Net;
using System.Net.Http.Json;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Tests.TestHelpers;
using Xunit;

namespace LibrarySystem.Api.Tests.Controllers;

public class BooksControllerTests : IClassFixture<LibrarySystemApiFactory>
{
    private readonly HttpClient _client;

    public BooksControllerTests(LibrarySystemApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsSeededBooks()
    {
        var response = await _client.GetAsync("/api/books");

        response.EnsureSuccessStatusCode();
        var books = await response.Content.ReadFromJsonAsync<List<BookReadDto>>();
        Assert.NotNull(books);
        Assert.True(books!.Count >= 5);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_ForMissingBook()
    {
        var response = await _client.GetAsync("/api/books/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_ThenGetById_RoundTrips()
    {
        var newBook = new BookCreateDto
        {
            Title = "Integration Test Book",
            Author = "Test Author",
            Isbn = "9999999999",
            PublicationYear = 2021,
        };

        var createResponse = await _client.PostAsJsonAsync("/api/books", newBook);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<BookReadDto>();
        Assert.NotNull(created);

        var getResponse = await _client.GetAsync(createResponse.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var fetched = await getResponse.Content.ReadFromJsonAsync<BookReadDto>();
        Assert.Equal(newBook.Title, fetched!.Title);
    }

    [Fact]
    public async Task Create_ReturnsValidationProblem_ForEmptyTitle()
    {
        var invalidBook = new BookCreateDto
        {
            Title = "",
            Author = "",
            Isbn = "",
            PublicationYear = 1800,
        };

        var response = await _client.PostAsJsonAsync("/api/books", invalidBook);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
