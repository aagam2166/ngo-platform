import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET as string;

export const generateToken = (payload: { userId: string; role: string }) => {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET) as { userId: string; role: string };
};