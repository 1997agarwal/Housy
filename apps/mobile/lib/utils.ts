import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const COLORS = {
  primary:    '#E8673A',
  primaryDark:'#C4512A',
  background: '#FFFFFF',
  surface:    '#F7F7F7',
  border:     '#E5E7EB',
  textPrimary:'#1A1A2E',
  textSecondary: '#6B7280',
  success:    '#22C55E',
  warning:    '#F59E0B',
  error:      '#EF4444',
  info:       '#6366F1',
} as const;

export const FONTS = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
} as const;

/** Format Indian Rupee amounts — e.g. 180000 → "₹1.8L" */
export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
}

/** Format date to readable string */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Normalize Indian phone number to E.164 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/** Calculate % progress from tasks */
export function calcProgress(total: number, done: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/** Feasibility level → color */
export function feasibilityColor(level: string): string {
  switch (level) {
    case 'high':         return COLORS.success;
    case 'medium':       return COLORS.warning;
    case 'low':          return COLORS.error;
    case 'needs_expert': return COLORS.info;
    default:             return COLORS.textSecondary;
  }
}
