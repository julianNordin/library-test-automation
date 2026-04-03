namespace LibrarySystem.Api.Common;

public class LoanLimitExceededException : Exception
{
    public LoanLimitExceededException(string message) : base(message)
    {
    }
}
