namespace LibrarySystem.Api.Common;

public class DeleteConflictException : Exception
{
    public DeleteConflictException(string message) : base(message)
    {
    }
}
