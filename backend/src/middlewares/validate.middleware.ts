// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { AppError } from '../utils/AppError';

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query as Request['query'];
      if (parsed.params !== undefined) req.params = parsed.params as Request['params'];
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const details = zodError.issues.map((issue: z.ZodIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        const message = details.map((d) => `${d.path}: ${d.message}`).join(', ');
        return next(
          new AppError(message || 'Dữ liệu đầu vào không hợp lệ', 400, {
            code: 'VALIDATION_ERROR',
            details,
          })
        );
      }
      return next(error);
    }
  };
};
