// Browser-safe limits shared by UI and server.
export const MAX_PHOTOS_PER_MILESTONE = 6;
export const MAX_REVISIONS = 3;
// Trades a homeowner can ask for extra work from (structural roles are excluded: those change scope, not add-ons).
export const CHANGE_TRADES = ['mason', 'plumber', 'electrician', 'tiler', 'painter', 'carpenter', 'waterproofer'] as const;
export const MAX_PENDING_CHANGES = 3;
