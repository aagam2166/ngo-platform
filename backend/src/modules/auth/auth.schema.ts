import { z } from 'zod';

const ngoProfileSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  registrationNo: z.string().min(1, 'Registration number is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
});

const volunteerProfileSchema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['CITIZEN', 'NGO_ADMIN', 'VOLUNTEER']).optional().default('CITIZEN'),
  phone: z.string().optional(),
  ngoProfile: ngoProfileSchema.optional(),
  volunteerProfile: volunteerProfileSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;