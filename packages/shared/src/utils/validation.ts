import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().min(0);

// Validation helpers
export const createValidationError = (field: string, message: string) => ({
  field,
  message,
  success: false as const,
});

export const validateOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError(errors);
  }
  return result.data;
};

export class ValidationError extends Error {
  constructor(public errors: Array<{ field: string; message: string }>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Helper functions
export const createSuccessResponse = <T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> => ({
  success: true,
  data,
  meta,
});

export const createErrorResponse = (
  code: string,
  message: string,
  details?: unknown
): ApiResponse => ({
  success: false,
  error: { code, message, details },
});

// UUID Generator
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Date helpers
export const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

export const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};

export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

// Score calculation helpers
export const calculateRunRate = (runs: number, overs: number): number => {
  if (overs === 0) return 0;
  return Math.round((runs / overs) * 100) / 100;
};

export const calculateStrikeRate = (runs: number, balls: number): number => {
  if (balls === 0) return 0;
  return Math.round((runs / balls) * 100 * 100) / 100;
};

export const calculateAverage = (runs: number, dismissals: number): number => {
  if (dismissals === 0) return runs;
  return Math.round((runs / dismissals) * 100) / 100;
};

export const calculateNetRunRate = (
  runsScored: number,
  oversFaced: number,
  runsConceded: number,
  oversBowled: number
): number => {
  if (oversBowled === 0 || oversFaced === 0) return 0;
  const runRateFor = runsScored / oversFaced;
  const runRateAgainst = runsConceded / oversBowled;
  return Math.round((runRateFor - runRateAgainst) * 100) / 100;
};

export const oversToBalls = (overs: number): number => {
  const oversStr = overs.toString();
  const [whole, decimal] = oversStr.split('.');
  const wholeBalls = parseInt(whole || '0', 10) * 6;
  const extraBalls = parseInt(decimal || '0', 10);
  return wholeBalls + extraBalls;
};

export const ballsToOvers = (balls: number): string => {
  const wholeOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${wholeOvers}.${remainingBalls}`;
};

export const formatOvers = (overs: number): string => {
  const whole = Math.floor(overs);
  const balls = Math.round((overs - whole) * 10);
  return `${whole}.${balls}`;
};

// Array helpers
export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Deep clone
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
