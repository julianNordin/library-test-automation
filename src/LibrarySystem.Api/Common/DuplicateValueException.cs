namespace LibrarySystem.Api.Common;

public class DuplicateValueException : Exception
{
    public DuplicateValueException(string message) : base(message)
    {
    }
}
