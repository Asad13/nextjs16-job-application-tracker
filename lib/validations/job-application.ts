import { z } from 'zod';

/*
  status: string;
  ** order: number;
  appliedDate: string | Date
*/

export const createJobApplicationInputSchema = z.strictObject({
  title: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  salary: z.string().max(50).optional(),
  location: z.string().max(150).optional(),
  jobUrl: z.string().max(2048).optional(),
  notes: z.string().max(5000).optional(),
  description: z.string().max(5000).optional(),
  tags: z.string().max(500).optional(),
  boardId: z.string().length(24),
  columnId: z.string().length(24),
  userId: z.string().length(24).optional(),
});

export type CreateJobApplicationInputType = z.infer<
  typeof createJobApplicationInputSchema
>;

export const updateJobApplicationInputSchema =
  createJobApplicationInputSchema.partial();

export type UpdateJobApplicationInputType = z.infer<
  typeof updateJobApplicationInputSchema
>;
