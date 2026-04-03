namespace LibrarySystem.Api.Common;

public class LoanAlreadyReturnedException : Exception
{
    public LoanAlreadyReturnedException(string message) : base(message)
    {
    }
}
