import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['FOOD', 'MEDICAL', 'CLOTHING', 'SHELTER', 'EDUCATION', 'FINANCIAL', 'OTHER']),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().optional(),
  description: z.string().optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export const allocateResourceSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type AllocateResourceInput = z.infer<typeof allocateResourceSchema>;