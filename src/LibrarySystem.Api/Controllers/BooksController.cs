using LibrarySystem.Api.DTOs;
using LibrarySystem.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LibrarySystem.Api.Controllers;

/// <summary>
/// CRUD operations for the book catalog.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    /// <summary>Gets every book in the catalog.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BookReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BookReadDto>>> GetAll()
    {
        var books = await _bookService.GetAllAsync();
        return Ok(books.Select(b => b.ToReadDto()));
    }

    /// <summary>Gets a single book by id.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BookReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookReadDto>> GetById(int id)
    {
        var book = await _bookService.GetByIdAsync(id);
        if (book is null)
        {
            return NotFound();
        }

        return Ok(book.ToReadDto());
    }

    /// <summary>Adds a new book to the catalog.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(BookReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BookReadDto>> Create(BookCreateDto dto)
    {
        var book = await _bookService.CreateAsync(dto.ToEntity());
        return CreatedAtAction(nameof(GetById), new { id = book.Id }, book.ToReadDto());
    }

    /// <summary>Updates an existing book's details.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, BookUpdateDto dto)
    {
        var success = await _bookService.UpdateAsync(id, dto.ToEntity());
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>Deletes a book. Fails if the book has any loan history.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _bookService.DeleteAsync(id);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
