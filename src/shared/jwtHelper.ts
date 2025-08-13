import '../config/config';
import { sign, verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

export function generateToken(user: {
  id: string;
  role: string;
  name: string;
  username: string;
  membershipPaid: boolean;
}): string {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    membershipPaid: user.membershipPaid,
  };

  const expiresIn = parseInt(process.env.JWT_EXPIRATION || '3600'); // Convert to number
  const token = sign(payload, SECRET_KEY, { expiresIn });
  return token;
}

export function verifyToken(token: string): {
  id: string;
  username: string;
  role: string;
  membershipPaid: boolean;
} {
  try {
    return verify(token, SECRET_KEY) as {
      id: string;
      username: string;
      role: string;
      membershipPaid: boolean;
    };
  } catch {
    throw new Error('unauthorized');
  }
}
