// Housy project catalog + estimate engine.
// Pure functions only — shared by the browser (live preview) and the API (quote).
import { getCity } from './cities';
// NOTE: all rates are placeholder baselines (Bareilly, Standard tier). Calibrate with real quotes.

export type Tier = 'economy' | 'standard' | 'premium';
export type Trade = 'mason' | 'plumber' | 'electrician' | 'tiler' | 'painter' | 'carpenter' | 'engineer' | 'waterproofer' | 'designer' | 'architect';
export type Category = 'build' | 'renovate' | 'interiors';
export const CATEGORIES: Record<Category, { title: string; blurb: string }> = {
  build: { title: 'Build a new home', blurb: 'From approved drawings to handover.' },
  renovate: { title: 'Renovate', blurb: 'Fix, upgrade or reshape what you already have.' },
  interiors: { title: 'Interiors', blurb: 'Design and deliver the inside — kitchens, wardrobes, ceilings, lighting.' },
};
export const STYLES = ['Modern', 'Contemporary', 'Minimalist', 'Traditional', 'Scandinavian'] as const;
// Interiors typically run ~8–12% of the property value (industry rule of thumb).
export const interiorBudgetGuide = (valueLakh: number) => ({ low: valueLakh * 100000 * 0.08, high: valueLakh * 100000 * 0.12 });

export const TIERS: Record<Tier, { label: string; mult: number; blurb: string }> = {
  economy: { label: 'Economy', mult: 0.75, blurb: 'Basic fittings, functional finish' },
  standard: { label: 'Standard', mult: 1, blurb: 'Branded fittings, good finish' },
  premium: { label: 'Premium', mult: 1.5, blurb: 'Premium brands, designer finish' },
};

type Basis = 'area' | 'fixed' | 'drain';
interface Item { label: string; kind: 'labor' | 'material'; basis: Basis; rate: number }
export interface RoomDef { id: string; name: string; weight: number }   // weight = share of a whole-home job (weights sum to 1)
export interface FinishDef { id: string; label: string; phaseId: string; options: { id: string; label: string; mult: number }[] } // mult applies to that phase's materials
interface PhaseDef { id: string; name: string; trade: Trade; baseDays: number; daysPerSqft?: number; items: Item[] }

export interface ProjectType {
  id: string;
  category: Category;
  expert?: Trade;            // who does the paid first visit (default: mason, or engineer if needsEngineer)
  visitLabel: string;        // "Site visit" | "Design consultation" …
  featured?: boolean;        // shown first on the post-sign-up welcome screen
  interiors?: boolean;       // asks for a style, shows the property-value budget guide
  rooms?: RoomDef[];         // room-by-room scope (interiors): unselected rooms drop out of the price
  finishes?: FinishDef[];    // finish grades that change one phase's material cost
  staticFlags?: { level: 'green' | 'amber' | 'red'; text: string }[];
  title: string;
  tagline: string;
  emoji: string;
  areaLabel: string;
  defaultArea: number;
  askDrain?: boolean;
  needsEngineer?: boolean;
  visitFee: number;
  phases: PhaseDef[];
}

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'new-bathroom', featured: true, category: 'renovate', visitLabel: 'Site visit', title: 'Add a bathroom', emoji: '🚿',
    tagline: 'Plumbing, drainage, waterproofing, tiling and fittings — planned and delivered as one job.',
    areaLabel: 'Bathroom size (sq ft)', defaultArea: 45, askDrain: true, visitFee: 499,
    phases: [
      { id: 'demo', name: 'Marking, core-cutting & demolition', trade: 'mason', baseDays: 2, items: [
        { label: 'Mason + helpers', kind: 'labor', basis: 'fixed', rate: 3200 },
        { label: 'Core-cutting & debris removal', kind: 'labor', basis: 'fixed', rate: 2500 }] },
      { id: 'plumbing', name: 'Plumbing & drainage rough-in', trade: 'plumber', baseDays: 3, items: [
        { label: 'Plumber + helper', kind: 'labor', basis: 'fixed', rate: 4200 },
        { label: 'Drain line (PVC, trap, slope work)', kind: 'material', basis: 'drain', rate: 380 },
        { label: 'CPVC supply lines & fittings', kind: 'material', basis: 'fixed', rate: 5500 }] },
      { id: 'waterproof', name: 'Waterproofing & curing', trade: 'waterproofer', baseDays: 4, items: [
        { label: 'Waterproofing labor', kind: 'labor', basis: 'area', rate: 55 },
        { label: 'Waterproofing chemical', kind: 'material', basis: 'area', rate: 70 }] },
      { id: 'tiling', name: 'Wall & floor tiling', trade: 'tiler', baseDays: 3, daysPerSqft: 0.05, items: [
        { label: 'Tiling labor (floor + wall)', kind: 'labor', basis: 'area', rate: 260 },
        { label: 'Tiles, adhesive, grout', kind: 'material', basis: 'area', rate: 520 }] },
      { id: 'fittings', name: 'Sanitary ware, electrical & finishing', trade: 'plumber', baseDays: 3, items: [
        { label: 'Fitting labor + electrician', kind: 'labor', basis: 'fixed', rate: 4500 },
        { label: 'WC, basin, taps, shower, geyser point', kind: 'material', basis: 'fixed', rate: 21000 }] },
    ],
  },
  {
    id: 'kitchen', featured: true, category: 'renovate', visitLabel: 'Site visit', title: 'Renovate kitchen', emoji: '🍳',
    tagline: 'Platform, tiling, plumbing, wiring and cabinetry with a single point of accountability.',
    areaLabel: 'Kitchen size (sq ft)', defaultArea: 100, visitFee: 499,
    phases: [
      { id: 'demo', name: 'Demolition & civil work', trade: 'mason', baseDays: 3, items: [
        { label: 'Mason + helpers', kind: 'labor', basis: 'fixed', rate: 5500 },
        { label: 'Platform slab & cement work', kind: 'material', basis: 'fixed', rate: 9000 }] },
      { id: 'mep', name: 'Plumbing & electrical points', trade: 'plumber', baseDays: 3, items: [
        { label: 'Plumber + electrician', kind: 'labor', basis: 'fixed', rate: 7000 },
        { label: 'Pipes, wiring, switches', kind: 'material', basis: 'fixed', rate: 8000 }] },
      { id: 'tiling', name: 'Tiling & granite platform', trade: 'tiler', baseDays: 4, daysPerSqft: 0.03, items: [
        { label: 'Tiling labor', kind: 'labor', basis: 'area', rate: 90 },
        { label: 'Tiles + granite top', kind: 'material', basis: 'area', rate: 380 }] },
      { id: 'cabinets', name: 'Cabinets & finishing', trade: 'carpenter', baseDays: 6, daysPerSqft: 0.05, items: [
        { label: 'Carpentry labor', kind: 'labor', basis: 'area', rate: 250 },
        { label: 'Modular cabinets, sink, chimney point', kind: 'material', basis: 'area', rate: 900 }] },
    ],
  },
  {
    id: 'wall-break', category: 'renovate', visitLabel: 'Site visit', title: 'Break or move a wall', emoji: '🧱',
    tagline: 'Structural engineer sign-off first, then safe demolition and re-finishing.',
    areaLabel: 'Wall area (sq ft)', defaultArea: 100, needsEngineer: true, visitFee: 999,
    phases: [
      { id: 'engineer', name: 'Structural engineer assessment & sign-off', trade: 'engineer', baseDays: 2, items: [
        { label: 'Engineer site visit + written opinion', kind: 'labor', basis: 'fixed', rate: 4000 }] },
      { id: 'demo', name: 'Propping & controlled demolition', trade: 'mason', baseDays: 2, daysPerSqft: 0.02, items: [
        { label: 'Demolition labor', kind: 'labor', basis: 'area', rate: 75 },
        { label: 'Props, debris removal', kind: 'material', basis: 'area', rate: 40 }] },
      { id: 'finish', name: 'Patching, plastering & paint', trade: 'mason', baseDays: 3, daysPerSqft: 0.03, items: [
        { label: 'Plaster/paint labor', kind: 'labor', basis: 'area', rate: 55 },
        { label: 'Cement, putty, paint', kind: 'material', basis: 'area', rate: 60 }] },
    ],
  },
  {
    id: 'rewiring', category: 'renovate', visitLabel: 'Site visit', title: 'Rewire the house', emoji: '💡',
    tagline: 'Safe concealed wiring, load planning and earthing by licensed electricians.',
    areaLabel: 'Built-up area (sq ft)', defaultArea: 1200, visitFee: 499,
    phases: [
      { id: 'survey', name: 'Load survey & layout', trade: 'electrician', baseDays: 1, items: [
        { label: 'Load calculation & layout', kind: 'labor', basis: 'fixed', rate: 2500 }] },
      { id: 'chasing', name: 'Wall chasing & conduit', trade: 'electrician', baseDays: 4, daysPerSqft: 0.004, items: [
        { label: 'Chasing & conduit labor', kind: 'labor', basis: 'area', rate: 24 },
        { label: 'Conduit & boxes', kind: 'material', basis: 'area', rate: 14 }] },
      { id: 'wiring', name: 'Wiring, DB & earthing', trade: 'electrician', baseDays: 4, daysPerSqft: 0.004, items: [
        { label: 'Wiring labor', kind: 'labor', basis: 'area', rate: 28 },
        { label: 'Copper wire, MCBs, DB, earthing', kind: 'material', basis: 'area', rate: 75 }] },
      { id: 'patch', name: 'Patch-up & fittings', trade: 'mason', baseDays: 3, daysPerSqft: 0.002, items: [
        { label: 'Patching & switch plates', kind: 'labor', basis: 'area', rate: 18 },
        { label: 'Switches, plates, patching material', kind: 'material', basis: 'area', rate: 35 }] },
    ],
  },
  {
    id: 'waterproofing', category: 'renovate', visitLabel: 'Site visit', title: 'Roof / terrace waterproofing', emoji: '☔',
    tagline: 'Fix leakage properly, with a written warranty.',
    areaLabel: 'Terrace / roof area (sq ft)', defaultArea: 800, visitFee: 499,
    phases: [
      { id: 'prep', name: 'Surface prep & crack repair', trade: 'mason', baseDays: 2, daysPerSqft: 0.002, items: [
        { label: 'Prep labor', kind: 'labor', basis: 'area', rate: 14 },
        { label: 'Repair mortar & polymer', kind: 'material', basis: 'area', rate: 12 }] },
      { id: 'coat', name: 'Waterproof coating (2–3 coats)', trade: 'waterproofer', baseDays: 3, daysPerSqft: 0.002, items: [
        { label: 'Application labor', kind: 'labor', basis: 'area', rate: 16 },
        { label: 'Waterproofing membrane / coating', kind: 'material', basis: 'area', rate: 42 }] },
      { id: 'cure', name: 'Flood test & finish', trade: 'mason', baseDays: 3, items: [
        { label: 'Flood test & protective screed', kind: 'labor', basis: 'fixed', rate: 3000 }] },
    ],
  },
  {
    id: 'painting', category: 'renovate', visitLabel: 'Site visit', title: 'Painting & putty', emoji: '🎨',
    tagline: 'Interior and exterior painting with measured quantities and finish checks.',
    areaLabel: 'Built-up area (sq ft)', defaultArea: 1200, visitFee: 299,
    phases: [
      { id: 'prep', name: 'Surface prep & putty', trade: 'painter', baseDays: 3, daysPerSqft: 0.004, items: [
        { label: 'Prep & putty labor', kind: 'labor', basis: 'area', rate: 14 },
        { label: 'Putty & primer', kind: 'material', basis: 'area', rate: 16 }] },
      { id: 'paint', name: 'Painting (2 coats)', trade: 'painter', baseDays: 4, daysPerSqft: 0.004, items: [
        { label: 'Painting labor', kind: 'labor', basis: 'area', rate: 13 },
        { label: 'Paint', kind: 'material', basis: 'area', rate: 22 }] },
    ],
  },
  {
    id: 'full-renovation', featured: true, category: 'renovate', visitLabel: 'Site visit', title: 'Full-home renovation', emoji: '🏠',
    tagline: 'Plan and run a whole-house renovation, trade by trade, in the right order.',
    areaLabel: 'Built-up area (sq ft)', defaultArea: 1800, needsEngineer: true, visitFee: 1499,
    phases: [
      { id: 'audit', name: 'Structural & services audit', trade: 'engineer', baseDays: 3, items: [
        { label: 'Engineer + plumber + electrician audit', kind: 'labor', basis: 'fixed', rate: 9000 }] },
      { id: 'civil', name: 'Civil work & waterproofing', trade: 'mason', baseDays: 12, daysPerSqft: 0.01, items: [
        { label: 'Mason gang', kind: 'labor', basis: 'area', rate: 140 },
        { label: 'Cement, bricks, sand, waterproofing', kind: 'material', basis: 'area', rate: 180 }] },
      { id: 'mep', name: 'Plumbing & electrical', trade: 'plumber', baseDays: 10, daysPerSqft: 0.006, items: [
        { label: 'Plumbing + electrical labor', kind: 'labor', basis: 'area', rate: 120 },
        { label: 'Pipes, wiring, fittings', kind: 'material', basis: 'area', rate: 210 }] },
      { id: 'floor', name: 'Flooring & tiling', trade: 'tiler', baseDays: 10, daysPerSqft: 0.008, items: [
        { label: 'Tiling labor', kind: 'labor', basis: 'area', rate: 70 },
        { label: 'Tiles & adhesive', kind: 'material', basis: 'area', rate: 260 }] },
      { id: 'finish', name: 'Carpentry, putty & painting', trade: 'painter', baseDays: 10, daysPerSqft: 0.008, items: [
        { label: 'Carpentry + painting labor', kind: 'labor', basis: 'area', rate: 95 },
        { label: 'Doors, paint, hardware', kind: 'material', basis: 'area', rate: 190 }] },
    ],
  },
  {
    id: 'new-house', featured: true, category: 'build', visitLabel: 'Plot visit', expert: 'architect', needsEngineer: true, title: 'Build a new house', emoji: '🏗️',
    tagline: 'Architect-drawn plan, engineer-supervised structure, and every trade in sequence — plot to handover.',
    areaLabel: 'Total built-up area (sq ft, all floors)', defaultArea: 1500, visitFee: 1499,
    staticFlags: [{ level: 'amber', text: 'Map approval from your local development authority is required before construction. Timeline assumes approval is obtained during the design phase.' }],
    phases: [
      { id: 'design', name: 'Architectural design, drawings & approvals', trade: 'architect', baseDays: 30, items: [
        { label: 'Architect fee (plans, structural coordination)', kind: 'labor', basis: 'area', rate: 40 },
        { label: 'Soil test, survey & approval filing', kind: 'labor', basis: 'fixed', rate: 25000 }] },
      { id: 'foundation', name: 'Excavation, foundation & plinth', trade: 'mason', baseDays: 10, daysPerSqft: 0.01, items: [
        { label: 'Foundation labor', kind: 'labor', basis: 'area', rate: 110 },
        { label: 'Cement, steel, aggregate', kind: 'material', basis: 'area', rate: 190 }] },
      { id: 'structure', name: 'RCC structure (columns, beams, slabs)', trade: 'mason', baseDays: 25, daysPerSqft: 0.03, items: [
        { label: 'Structure labor & shuttering', kind: 'labor', basis: 'area', rate: 160 },
        { label: 'Steel, cement, ready-mix', kind: 'material', basis: 'area', rate: 420 }] },
      { id: 'masonry', name: 'Brickwork & plastering', trade: 'mason', baseDays: 15, daysPerSqft: 0.015, items: [
        { label: 'Masonry & plaster labor', kind: 'labor', basis: 'area', rate: 90 },
        { label: 'Bricks, sand, cement', kind: 'material', basis: 'area', rate: 130 }] },
      { id: 'mep', name: 'Plumbing & electrical', trade: 'plumber', baseDays: 12, daysPerSqft: 0.01, items: [
        { label: 'Plumbing + electrical labor', kind: 'labor', basis: 'area', rate: 80 },
        { label: 'Pipes, wiring, fittings', kind: 'material', basis: 'area', rate: 150 }] },
      { id: 'flooring', name: 'Flooring, doors & windows', trade: 'tiler', baseDays: 12, daysPerSqft: 0.01, items: [
        { label: 'Tiling & fitting labor', kind: 'labor', basis: 'area', rate: 60 },
        { label: 'Tiles, doors, windows', kind: 'material', basis: 'area', rate: 260 }] },
      { id: 'finish', name: 'Painting & finishing', trade: 'painter', baseDays: 8, daysPerSqft: 0.006, items: [
        { label: 'Painting labor', kind: 'labor', basis: 'area', rate: 40 },
        { label: 'Putty & paint', kind: 'material', basis: 'area', rate: 70 }] },
    ],
  },
  {
    id: 'interiors-full', featured: true, category: 'interiors', visitLabel: 'Design consultation', expert: 'designer', interiors: true, title: 'Full-home interiors', emoji: '🛋️',
    tagline: 'A designer plans your whole home in 3D, you approve every look, then verified crews build it.',
    areaLabel: 'Carpet area (sq ft)', defaultArea: 1000, visitFee: 999,
    rooms: [
      { id: 'living', name: 'Living room', weight: 0.22 }, { id: 'kitchen', name: 'Modular kitchen', weight: 0.18 },
      { id: 'master', name: 'Master bedroom', weight: 0.18 }, { id: 'bedroom2', name: 'Bedroom 2', weight: 0.12 },
      { id: 'kids', name: 'Kids’ room', weight: 0.10 }, { id: 'dining', name: 'Dining', weight: 0.08 },
      { id: 'study', name: 'Study / home office', weight: 0.06 }, { id: 'pooja', name: 'Pooja unit', weight: 0.03 },
      { id: 'balcony', name: 'Balcony', weight: 0.03 },
    ],
    finishes: [
      { id: 'shutter', label: 'Cabinet & wardrobe shutters', phaseId: 'carpentry', options: [
        { id: 'laminate', label: 'Laminate (durable, most popular)', mult: 1 }, { id: 'acrylic', label: 'Acrylic (glossy, modern)', mult: 1.18 }, { id: 'pu', label: 'PU / veneer (premium)', mult: 1.4 }] },
      { id: 'lighting', label: 'Lighting', phaseId: 'electrical', options: [
        { id: 'standard', label: 'Standard (panel + downlights)', mult: 1 }, { id: 'designer', label: 'Designer (cove, profile & accent)', mult: 1.35 }] },
    ],
    staticFlags: [{ level: 'green', text: 'Design is approved by you in 3D before any work or material order starts.' }],
    phases: [
      { id: 'design', name: 'Design: space planning, 3D & working drawings', trade: 'designer', baseDays: 14, items: [
        { label: 'Designer fee', kind: 'labor', basis: 'area', rate: 70 },
        { label: '3D renders & drawings', kind: 'labor', basis: 'fixed', rate: 15000 }] },
      { id: 'civil', name: 'Civil changes & false ceiling', trade: 'mason', baseDays: 8, daysPerSqft: 0.006, items: [
        { label: 'Civil & ceiling labor', kind: 'labor', basis: 'area', rate: 45 },
        { label: 'Gypsum / POP, framing', kind: 'material', basis: 'area', rate: 55 }] },
      { id: 'electrical', name: 'Electrical & lighting', trade: 'electrician', baseDays: 6, daysPerSqft: 0.004, items: [
        { label: 'Wiring & fixture labor', kind: 'labor', basis: 'area', rate: 35 },
        { label: 'Lights, switches, wiring', kind: 'material', basis: 'area', rate: 90 }] },
      { id: 'carpentry', name: 'Modular kitchen, wardrobes & carpentry', trade: 'carpenter', baseDays: 20, daysPerSqft: 0.015, items: [
        { label: 'Factory finishing & installation labor', kind: 'labor', basis: 'area', rate: 110 },
        { label: 'Plywood, laminates, hardware, countertop', kind: 'material', basis: 'area', rate: 240 }] },
      { id: 'walls', name: 'Wall finishes & painting', trade: 'painter', baseDays: 6, daysPerSqft: 0.005, items: [
        { label: 'Painting labor', kind: 'labor', basis: 'area', rate: 30 },
        { label: 'Paint, texture, wallpaper', kind: 'material', basis: 'area', rate: 60 }] },
      { id: 'furnish', name: 'Furniture, décor & installation', trade: 'carpenter', baseDays: 7, daysPerSqft: 0.004, items: [
        { label: 'Installation labor', kind: 'labor', basis: 'area', rate: 50 },
        { label: 'Loose furniture, curtains, décor', kind: 'material', basis: 'area', rate: 110 }] },
      { id: 'handover', name: 'Deep clean & handover', trade: 'mason', baseDays: 2, items: [
        { label: 'Professional cleaning & snag fixing', kind: 'labor', basis: 'fixed', rate: 8000 }] },
    ],
  },
  {
    id: 'interiors-room', featured: true, category: 'interiors', visitLabel: 'Design consultation', expert: 'designer', interiors: true, title: 'Single-room makeover', emoji: '🛏️',
    tagline: 'One room, designed and delivered — bedroom, living room, kids’ room or study.',
    areaLabel: 'Room size (sq ft)', defaultArea: 150, visitFee: 499,
    staticFlags: [{ level: 'green', text: 'You approve the 3D design before any work starts.' }],
    phases: [
      { id: 'design', name: 'Design & 3D visualisation', trade: 'designer', baseDays: 7, items: [
        { label: 'Designer fee', kind: 'labor', basis: 'area', rate: 120 },
        { label: '3D renders', kind: 'labor', basis: 'fixed', rate: 6000 }] },
      { id: 'ceiling', name: 'False ceiling & lighting', trade: 'electrician', baseDays: 4, daysPerSqft: 0.01, items: [
        { label: 'Ceiling & lighting labor', kind: 'labor', basis: 'area', rate: 45 },
        { label: 'Ceiling material, lights', kind: 'material', basis: 'area', rate: 110 }] },
      { id: 'carpentry', name: 'Wardrobe, bed, storage & carpentry', trade: 'carpenter', baseDays: 10, daysPerSqft: 0.03, items: [
        { label: 'Carpentry labor', kind: 'labor', basis: 'area', rate: 120 },
        { label: 'Plywood, laminates, hardware', kind: 'material', basis: 'area', rate: 380 }] },
      { id: 'paint', name: 'Wall finishes & painting', trade: 'painter', baseDays: 3, daysPerSqft: 0.01, items: [
        { label: 'Painting labor', kind: 'labor', basis: 'area', rate: 25 },
        { label: 'Paint & texture', kind: 'material', basis: 'area', rate: 45 }] },
      { id: 'furnish', name: 'Furnishing & installation', trade: 'carpenter', baseDays: 3, daysPerSqft: 0.01, items: [
        { label: 'Installation labor', kind: 'labor', basis: 'area', rate: 30 },
        { label: 'Curtains, décor, loose furniture', kind: 'material', basis: 'area', rate: 200 }] },
    ],
  },
];

const ORDER: Category[] = ['build', 'renovate', 'interiors'];
PROJECT_TYPES.sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));

export const getType = (id: string) => PROJECT_TYPES.find((t) => t.id === id);

export interface EstimateInput { typeId: string; city: string; area: number; tier: Tier; drainFt?: number; rooms?: string[]; finishes?: Record<string, string> }
export interface EstimatePhase {
  id: string; name: string; trade: Trade; days: number;
  labor: number; material: number; subtotal: number;
}
export interface Estimate {
  phases: EstimatePhase[];
  labor: number; material: number; contingency: number; total: number;
  low: number; high: number; days: number;
  rooms?: { id: string; name: string; cost: number }[];   // approximate price per selected room (includes contingency)
  flags: { level: 'green' | 'amber' | 'red'; text: string }[];
}

const round50 = (n: number) => Math.round(n / 50) * 50;
export const CONTINGENCY = 0.15;

export function estimate(input: EstimateInput): Estimate {
  const type = getType(input.typeId);
  if (!type) throw new Error(`Unknown project type: ${input.typeId}`);
  const cityMult = getCity(input.city)?.mult ?? 1;
  const tierMult = TIERS[input.tier].mult;
  const drain = Math.max(0, input.drainFt ?? 0);
  // Room scope: only the selected rooms are priced. Area-based items scale by the selected share of the whole-home job.
  const allRooms = type.rooms ?? [];
  const picked = allRooms.length ? (input.rooms?.length ? allRooms.filter((r) => input.rooms!.includes(r.id)) : allRooms) : [];
  const share = allRooms.length ? picked.reduce((a, r) => a + r.weight, 0) / allRooms.reduce((a, r) => a + r.weight, 0) : 1;
  const area = Math.max(1, input.area) * share;
  const finishMult = (phaseId: string) => (type.finishes ?? [])
    .filter((f) => f.phaseId === phaseId)
    .reduce((m, f) => m * (f.options.find((o) => o.id === input.finishes?.[f.id])?.mult ?? 1), 1);

  const phases: EstimatePhase[] = type.phases.map((p) => {
    let labor = 0, material = 0;
    for (const it of p.items) {
      const qty = it.basis === 'area' ? area : it.basis === 'drain' ? drain : 1;
      // Labor scales with city only; materials scale with quality tier too.
      const v = qty * it.rate * cityMult * (it.kind === 'material' ? tierMult * finishMult(p.id) : 1);
      if (it.kind === 'labor') labor += v; else material += v;
    }
    return {
      id: p.id, name: p.name, trade: p.trade,
      days: Math.max(1, Math.round(p.baseDays + (p.daysPerSqft ?? 0) * area)),
      labor: round50(labor), material: round50(material), subtotal: round50(labor + material),
    };
  });

  const labor = phases.reduce((a, p) => a + p.labor, 0);
  const material = phases.reduce((a, p) => a + p.material, 0);
  const contingency = round50((labor + material) * CONTINGENCY);
  const total = labor + material + contingency;

  const flags: Estimate['flags'] = [];
  if (type.needsEngineer) flags.push({ level: 'red', text: 'Structural work involved — a licensed structural engineer must sign off before any demolition. This is built into the plan.' });
  if (type.askDrain) {
    if (drain > 25) flags.push({ level: 'amber', text: `Drain run of ${drain} ft is long — needs a 1:40 slope check and possibly an extra inspection chamber.` });
    else if (drain === 0) flags.push({ level: 'amber', text: 'Distance to the nearest drain/septic is unknown — the site visit will measure it; cost may change.' });
    else flags.push({ level: 'green', text: `Drain run of ${drain} ft is comfortably within a workable 1:40 slope.` });
  }
  if (type.staticFlags) flags.push(...type.staticFlags);
  if (input.tier === 'premium') flags.push({ level: 'green', text: 'Premium tier: material lead-times can add 3–7 days.' });

  const pickedWeight = picked.reduce((a, r) => a + r.weight, 0);
  return {
    phases, labor, material, contingency, total,
    rooms: picked.length ? picked.map((r) => ({ id: r.id, name: r.name, cost: round50((total * r.weight) / pickedWeight) })) : undefined,
    low: round50(total * 0.9), high: round50(total * 1.12),
    days: phases.reduce((a, p) => a + p.days, 0), flags,
  };
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const inrShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2).replace(/\.?0+$/, '')}L` : inr(n);
