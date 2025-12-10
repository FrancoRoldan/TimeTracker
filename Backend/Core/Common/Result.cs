namespace Core.Common
{
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public T? Value { get; }
        public string? Error { get; }
        public List<string> Errors { get; }

        private Result(bool isSuccess, T? value, string? error, List<string>? errors = null)
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
            Errors = errors ?? new List<string>();
        }

        public static Result<T> Success(T value) => new Result<T>(true, value, null);
        public static Result<T> Failure(string error) => new Result<T>(false, default, error);
        public static Result<T> Failure(List<string> errors) =>
            new Result<T>(false, default, errors.FirstOrDefault(), errors);
    }

    public class Result
    {
        public bool IsSuccess { get; }
        public string? Error { get; }
        public List<string> Errors { get; }

        private Result(bool isSuccess, string? error, List<string>? errors = null)
        {
            IsSuccess = isSuccess;
            Error = error;
            Errors = errors ?? new List<string>();
        }

        public static Result Success() => new Result(true, null);
        public static Result Failure(string error) => new Result(false, error);
        public static Result Failure(List<string> errors) =>
            new Result(false, errors.FirstOrDefault(), errors);
    }
}
