import { verifyToken } from './jwtHelper';

export function validateAuthToken(authHeader: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token');
  }
  const token = authHeader.split(' ')[1];
  verifyToken(token);
  return token;
}
