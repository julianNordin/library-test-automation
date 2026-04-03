using System.Net;
using System.Net.Http.Json;
using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Tests.TestHelpers;
using Xunit;

namespace LibrarySystem.Api.Tests.Controllers;

public class LoansControllerTests : IClassFixture<LibrarySystemApiFactory>
{
    private readonly HttpClient _client;

    public LoansControllerTests(LibrarySystemApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task BorrowThenReturn_FullWorkflow_Succeeds()
    {
        // Seed data guarantees book id 1 and member id 1 exist in a fresh factory-backed database.
        var borrowRequest = new BorrowRequestDto { BookId = 1, MemberId = 1 };

        var borrowResponse = await _client.PostAsJsonAsync("/api/loans/borrow", borrowRequest);
        Assert.Equal(HttpStatusCode.Created, borrowResponse.StatusCode);

        var loan = await borrowResponse.Content.ReadFromJsonAsync<LoanReadDto>();
        Assert.NotNull(loan);
        Assert.False(loan!.IsOverdue);
        Assert.Null(loan.ReturnedDate);

        // Borrowing the same book again should conflict.
        var secondBorrowResponse = await _client.PostAsJsonAsync("/api/loans/borrow", borrowRequest);
        Assert.Equal(HttpStatusCode.Conflict, secondBorrowResponse.StatusCode);

        var returnResponse = await _client.PostAsync($"/api/loans/{loan.Id}/return", null);
        Assert.Equal(HttpStatusCode.OK, returnResponse.StatusCode);

        var returnedLoan = await returnResponse.Content.ReadFromJsonAsync<LoanReadDto>();
        Assert.NotNull(returnedLoan!.ReturnedDate);

        // Returning again should conflict.
        var doubleReturnResponse = await _client.PostAsync($"/api/loans/{loan.Id}/return", null);
        Assert.Equal(HttpStatusCode.Conflict, doubleReturnResponse.StatusCode);
    }

    [Fact]
    public async Task Borrow_ReturnsNotFound_ForMissingBook()
    {
        var request = new BorrowRequestDto { BookId = 99999, MemberId = 1 };

        var response = await _client.PostAsJsonAsync("/api/loans/borrow", request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
