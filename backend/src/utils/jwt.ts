import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

export function signToken(id: string): string {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
