export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: Array<Record<string, unknown>>;

  constructor(
    message: string,
    statusCode: number,
    options?: { code?: string; details?: Array<Record<string, unknown>> }
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Phân biệt lỗi nghiệp vụ và lỗi hệ thống (bugs)
    this.code = options?.code;
    this.details = options?.details;

    Error.captureStackTrace(this, this.constructor);
  }
}
