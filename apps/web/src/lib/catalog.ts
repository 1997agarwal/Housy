// Housy project catalog + estimate engine.
// Pure functions only — shared by the browser (live preview) and the API (quote).
// NOTE: all rates are placeholder baselines (Bareilly, Standard tier). Calibrate with real quotes.

export type Tier = 'economy' | 'standard' | 'premium';
export type Trade = 'mason' | 'plumber' | 'electrician' | 'tiler' | 'painter' | 'carpenter' | 'engineer' | 'waterproofer';

export const TIERS: Record<Tier, { label: string; mult: number; blurb: string }> = {
  economy: { label: 'Economy', mult: 0.75, blurb: 'Basic fittings, functional finish' },
  standard: { label: 'Standard', mult: 1, blurb: 'Branded fittings, good finish' },
  premium: { label: 'Premium', mult: 1.5, blurb: 'Premium brands, designer finish' },
};

// City multiplier vs the Bareilly baseline. Property city, not where the owner lives.
export const CITIES: Record<string, number> = {
  Bareilly: 1,
  Lucknow: 1.12,
  Agra: 1.05,
  Kanpur: 1.05,
  Meerut: 1.1,
  Varanasi: 1.02,
  Jaipur: 1.15,
  Indore: 1.1,
  'Delhi NCR': 1.4,
};

type Basis = 'area' | 'fixed' | 'drain';
interface Item { label: string; kind: 'labor' | 'material'; basis: Basis; rate: number }
interface PhaseDef { id: string; name: string; trade: Trade; baseDays: number; daysPerSqft?: number; items: Item[] }

export interface ProjectType {
  id: string;
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
    id: 'new-bathroom', title: 'Add a bathroom', emoji: '🚿',
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
    id: 'kitchen', title: 'Renovate kitchen', emoji: '🍳',
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
    id: 'wall-break', title: 'Break or move a wall', emoji: '🧱',
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
    id: 'rewiring', title: 'Rewire the house', emoji: '💡',
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
    id: 'waterproofing', title: 'Roof / terrace waterproofing', emoji: '☔',
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
    id: 'painting', title: 'Painting & putty', emoji: '🎨',
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
    id: 'full-renovation', title: 'Full-home renovation', emoji: '🏠',
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
];

export const getType = (id: string) => PROJECT_TYPES.find((t) => t.id === id);

export interface EstimateInput { typeId: string; city: string; area: number; tier: Tier; drainFt?: number }
export interface EstimatePhase {
  id: string; name: string; trade: Trade; days: number;
  labor: number; material: number; subtotal: number;
}
export interface Estimate {
  phases: EstimatePhase[];
  labor: number; material: number; contingency: number; total: number;
  low: number; high: number; days: number;
  flags: { level: 'green' | 'amber' | 'red'; text: string }[];
}

const round50 = (n: number) => Math.round(n / 50) * 50;
export const CONTINGENCY = 0.15;

export function estimate(input: EstimateInput): Estimate {
  const type = getType(input.typeId);
  if (!type) throw new Error(`Unknown project type: ${input.typeId}`);
  const cityMult = CITIES[input.city] ?? 1;
  const tierMult = TIERS[input.tier].mult;
  const area = Math.max(1, input.area);
  const drain = Math.max(0, input.drainFt ?? 0);

  const phases: EstimatePhase[] = type.phases.map((p) => {
    let labor = 0, material = 0;
    for (const it of p.items) {
      const qty = it.basis === 'area' ? area : it.basis === 'drain' ? drain : 1;
      // Labor scales with city only; materials scale with quality tier too.
      const v = qty * it.rate * cityMult * (it.kind === 'material' ? tierMult : 1);
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
  if (input.tier === 'premium') flags.push({ level: 'green', text: 'Premium tier: material lead-times can add 3–7 days.' });

  return {
    phases, labor, material, contingency, total,
    low: round50(total * 0.9), high: round50(total * 1.12),
    days: phases.reduce((a, p) => a + p.days, 0), flags,
  };
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const inrShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2).replace(/\.?0+$/, '')}L` : inr(n);
