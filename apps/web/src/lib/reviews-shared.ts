// Browser-safe review constants (server logic lives in reviews.ts).
export const CRITERIA = { quality: 'Quality of work', punctuality: 'Punctuality', behaviour: 'Behaviour', value: 'Value for money' } as const;
export type Criterion = keyof typeof CRITERIA;
