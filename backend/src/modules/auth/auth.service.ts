import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { RegisterInput, LoginInput } from './auth.schema';

export const registerService = async (data: RegisterInput) => {
  // 1. Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  // 2. Hash the password — never store plain text
  const passwordHash = await bcrypt.hash(data.password, 12);

  // 3. Create the user in database
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role ?? 'CITIZEN',
      phone: data.phone,
    },
    // Only return these fields — never return passwordHash
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // 4. Generate JWT token
  const token = generateToken({ userId: user.id, role: user.role });

  return { user, token };
};

export const loginService = async (data: LoginInput) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Use same error for both "user not found" and "wrong password"
  // This prevents attackers from knowing which one is wrong
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  // 3. Compare password with stored hash
  const isPasswordCorrect = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  // 4. Generate JWT token
  const token = generateToken({ userId: user.id, role: user.role });

  // 5. Return user without passwordHash
  const { passwordHash, ...safeUser } = user;

  return { user: safeUser, token };
};

export const getMeService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};