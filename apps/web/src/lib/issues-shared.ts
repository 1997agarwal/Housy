// Browser-safe issue constants (server logic lives in issues.ts).
export const ISSUE_TYPES = { quality: 'Quality problem', stoppage: 'Work stoppage', material: 'Material shortage', design: 'Design change', payment: 'Payment dispute' } as const;
export type IssueType = keyof typeof ISSUE_TYPES;
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export const ESCALATE_AFTER_HOURS = 48;
export const MAX_OPEN_ISSUES = 5;
