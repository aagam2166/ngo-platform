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

  const role = data.role ?? 'CITIZEN';

  // 3. Create user + role-specific profile in a single transaction
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role,
      phone: data.phone,
      ...(role === 'NGO_ADMIN' && data.ngoProfile
        ? {
            ngoProfile: {
              create: {
                name: data.ngoProfile.name,
                registrationNo: data.ngoProfile.registrationNo,
                description: data.ngoProfile.description,
                address: data.ngoProfile.address,
                city: data.ngoProfile.city,
                state: data.ngoProfile.state,
              },
            },
          }
        : {}),
      ...(role === 'VOLUNTEER' && data.volunteerProfile
        ? {
            volunteerProfile: {
              create: {
                bio: data.volunteerProfile.bio,
                skills: data.volunteerProfile.skills ?? [],
              },
            },
          }
        : {}),
    },
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

// Development-only service for instant role switching without API calls
export const devLoginService = async (role: 'CITIZEN' | 'VOLUNTEER' | 'NGO_ADMIN' | 'SUPER_ADMIN') => {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('Dev login not available in production', 403);
  }

  // Mock user emails and names by role
  const mockUsers: Record<string, { email: string; firstName: string; lastName: string }> = {
    CITIZEN: { email: 'citizen@dev.local', firstName: 'Dev', lastName: 'Citizen' },
    VOLUNTEER: { email: 'volunteer@dev.local', firstName: 'Dev', lastName: 'Volunteer' },
    NGO_ADMIN: { email: 'ngo@dev.local', firstName: 'Dev', lastName: 'NGO Admin' },
    SUPER_ADMIN: { email: 'admin@dev.local', firstName: 'Dev', lastName: 'Super Admin' },
  };

  const mockUser = mockUsers[role];

  // Try to find or create the dev user
  let user = await prisma.user.findUnique({
    where: { email: mockUser.email },
  });

  if (!user) {
    // Create dev user with dummy password
    user = await prisma.user.create({
      data: {
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role,
        passwordHash: 'dev-dummy', // Never used, just for schema
        isActive: true,
      },
    });
  }

  // Generate real JWT token
  const token = generateToken({ userId: user.id, role: user.role });

  const { passwordHash, ...safeUser } = user;

  return { 
    user: safeUser, 
    token,
    isDevelopmentUser: true,
  };
};