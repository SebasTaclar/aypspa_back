import '../config';
import { sign, verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

export function generateToken(user: {
  id: string;
  role: string;
  name: string;
  username: string;
}): string {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  const token = sign(payload, SECRET_KEY, { expiresIn: '1h' });
  return token;
}

export function verifyToken(token: string): { id: string; username: string; role: string } {
  try {
    return verify(token, SECRET_KEY) as { id: string; username: string; role: string };
  } catch {
    throw new Error('unauthorized');
  }
}
