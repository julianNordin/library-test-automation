namespace LibrarySystem.Api.Common;

public class BookNotAvailableException : Exception
{
    public BookNotAvailableException(string message) : base(message)
    {
    }
}
