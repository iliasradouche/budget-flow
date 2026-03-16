import { z } from 'zod'

export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid('Select a category').optional().or(z.literal('')),
  note: z.string().max(200, 'Note too long').optional(),
  date: z.string().min(1, 'Date is required'),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Too long'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color'),
  icon: z.string().min(1, 'Icon is required'),
  type: z.enum(['income', 'expense']),
  budget_limit: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), 'Must be a positive number'),
})

export const goalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Too long'),
  target_amount: z
    .string()
    .min(1, 'Target is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  deadline: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color'),
})

export const contributionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
})

export const recurringSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid().optional().or(z.literal('')),
  note: z.string().max(200, 'Note too long').optional(),
  interval_type: z.enum(['weekly', 'monthly', 'yearly']),
  next_date: z.string().min(1, 'Start date is required'),
})
