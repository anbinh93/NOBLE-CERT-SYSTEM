import { Response } from 'express';

export const sendSuccess = (res: Response, statusCode: number, data: any, message = 'Success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};
