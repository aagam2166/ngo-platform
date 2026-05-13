import {z} from 'zod';

export const createRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['FOOD', 'MEDICAL', 'SHELTER', 'EDUCATION', 'CLOTHING', 'FINANCIAL', 'OTHER'], {
    
    error: 'Invalid category', 
  }),
  urgencyLevel: z.number().int().min(1).max(5).default(1),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;