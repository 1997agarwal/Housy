// Feasibility advisor: transparent rules of thumb for the two questions homeowners fear most.
// Pure & browser-safe. It is a GUIDE, never a substitute for a licensed structural engineer.
//
// Safety principles (enforced by tests):
//  1. Uncertainty never yields green: any "not sure" answer caps the result at amber or worse.
//  2. Load-bearing risk is red: exterior walls, thick walls, and masonry walls other than half-brick partitions.
//  3. The verdict is the WORST of all rule outcomes; more risk can never lower it.

export type Level = 'green' | 'amber' | 'red';
const RANK: Record<Level, number> = { green: 0, amber: 1, red: 2 };
const worst = (a: Level, b: Level): Level => (RANK[a] >= RANK[b] ? a : b);

export interface Reason { level: Level; text: string }
export interface Verdict {
  level: Level; headline: string; reasons: Reason[]; steps: string[];
  professional: 'engineer' | 'mason' | 'plumber';
  fallInches?: number;   // bathroom: drop needed over the drain run at 1:40
}
export const DISCLAIMER = 'Housy’s advisor is a guide based on common practice, not a structural engineer. For any load-bearing decision, a licensed professional must inspect the site.';

// ── Wall ─────────────────────────────────────────────────────────────
export interface WallInput {
  construction: 'rcc' | 'masonry' | 'unsure';          // RCC frame (columns & beams) vs load-bearing brick walls
  position: 'interior' | 'exterior';
  thickness: 'partition' | 'brick9' | 'thick' | 'unsure'; // 4.5" | 9" | >9"
  above: 'floor' | 'roof' | 'unsure';                   // what sits directly above: another storey, or just the roof slab
  beamAbove: 'yes' | 'no' | 'unsure';
  services: 'yes' | 'no' | 'unsure';                    // pipes / cables / gas line inside the wall
  age: 'new' | 'mid' | 'old';                           // <10, 10–30, 30+ years
  opening: 'door' | 'wide' | 'full';                    // door-size, wide opening, or remove the whole wall
}

export function checkWall(i: WallInput): Verdict {
  const reasons: Reason[] = [];
  const add = (level: Level, text: string) => reasons.push({ level, text });
  const unsure = [i.construction, i.thickness, i.above, i.beamAbove, i.services].includes('unsure');

  if (i.position === 'exterior') add('red', 'Exterior walls carry roof and floor loads and protect the building envelope.');
  if (i.thickness === 'thick') add('red', 'Walls thicker than 9 inches are almost always structural.');

  if (i.construction === 'masonry') {
    if (i.thickness === 'partition') {
      add(i.above === 'floor' ? 'amber' : 'green', i.above === 'floor'
        ? 'A half-brick partition is normally non-structural, but there is a floor above — an expert should confirm nothing rests on it.'
        : 'A half-brick (4.5") partition in a masonry house is normally non-structural.');
    } else {
      add('red', 'In a load-bearing masonry house, 9-inch walls carry the slab above. Even a door-size opening needs an engineer-designed lintel.');
    }
  } else if (i.construction === 'rcc') {
    if (i.thickness === 'partition') add('green', 'In an RCC-framed building, a half-brick wall is normally just a partition.');
    else if (i.thickness === 'brick9') {
      if (i.above === 'floor' && i.beamAbove === 'no') add('red', 'There is a floor above but no beam over this wall — it may be carrying load.');
      else add('amber', 'A 9-inch wall in an RCC frame is usually infill, but an engineer should confirm no column or beam is embedded in it.');
    }
    if (i.opening !== 'door') add('amber', 'A wide opening or full removal changes how the frame behaves; get the beam above checked.');
  } else {
    // Unknown construction: assume the worse case.
    add(i.thickness === 'partition' ? 'amber' : 'red', 'We can’t tell if this is a framed or load-bearing structure. Until an expert confirms, treat any wall thicker than 4.5" as structural.');
  }

  if (i.construction === 'masonry' && i.opening !== 'door') add('red', 'Widening or removing masonry walls needs propping and a beam designed by an engineer.');
  if (i.age === 'old') add('amber', 'The building is 30+ years old: brick, mortar and slab condition must be checked before any cutting.');
  if (i.services === 'yes') add('amber', 'Pipes, cables or a gas line run through this wall — they must be re-routed and made safe first.');
  if (i.services === 'unsure') add('amber', 'Unknown services inside the wall: trace them with a detector before cutting.');

  let level = reasons.reduce<Level>((l, r) => worst(l, r.level), 'green');
  if (unsure) {
    level = worst(level, 'amber');
    add('amber', 'You answered “not sure” to something important — the advice stays cautious until it’s confirmed on site.');
  }

  const steps =
    level === 'red' ? [
      'Do not start any cutting or demolition.',
      'Book a licensed structural engineer to inspect the wall (Housy includes this in a wall project).',
      'Expect propping, a beam/lintel design and written sign-off before work begins.',
      'If you live in a society or a regulated colony, check whether permission is required.',
    ] : level === 'amber' ? [
      'Get a mason or engineer to inspect the wall before you commit.',
      'Trace and isolate pipes, cables or gas lines inside the wall.',
      'Plan dust and debris control; use controlled cutting rather than heavy hammering.',
      'Book a Housy site visit to confirm and lock a fixed quote.',
    ] : [
      'Mark and isolate any services, then cut with controlled tools to limit vibration.',
      'Protect floors, furniture and neighbouring rooms from dust.',
      'Plan the finish: patching plaster, floor levelling and paint at the joint.',
      'Book a Housy site visit for a fixed quote.',
    ];
  const headline = level === 'green' ? 'Likely non-structural — probably safe to modify'
    : level === 'amber' ? 'Possible, but get it checked first' : 'Do not proceed without a structural engineer';
  return { level, headline, reasons, steps, professional: level === 'green' ? 'mason' : 'engineer' };
}

// ── Bathroom addition ────────────────────────────────────────────────
export interface BathInput {
  floor: 'ground' | 'upper';
  drainFt: number;                                       // distance to the nearest drain / septic connection
  below: 'room' | 'none' | 'unsure';                     // upper floor only: is there a room under the new bathroom?
  shaft: 'yes' | 'no' | 'unsure';                        // existing plumbing shaft / wet wall within ~10 ft
  ventilation: 'window' | 'none';
}

// Drain pipes need a fall of about 1 in 40 to carry waste.
export const fallInches = (drainFt: number) => Math.round(((drainFt * 12) / 40) * 10) / 10;

export function checkBathroom(i: BathInput): Verdict {
  const reasons: Reason[] = [];
  const add = (level: Level, text: string) => reasons.push({ level, text });
  const fall = fallInches(i.drainFt);
  const redAt = i.floor === 'upper' ? 20 : 30;

  if (!(i.drainFt > 0)) add('amber', 'Distance to the drain is unknown — it decides feasibility, so it must be measured on site.');
  else if (i.drainFt > redAt) add('red', `The drain is ${i.drainFt} ft away, needing about ${fall} in of fall at 1:40. That usually needs a pump/ejector or relocating the bathroom.`);
  else if (i.drainFt > 15) add('amber', `The drain is ${i.drainFt} ft away, needing about ${fall} in of fall at 1:40 — expect a raised floor or a sunk slab and an inspection chamber.`);
  else add('green', `The drain is ${i.drainFt} ft away — about ${fall} in of fall at 1:40 is easy to achieve.`);

  if (i.floor === 'upper') {
    add('amber', 'On an upper floor the drain must run through the slab: plan a sunk slab or raised floor and a proper stack connection.');
    if (i.below === 'room') add('amber', 'There is a room under the new bathroom — a leak would damage it. Use double waterproofing and a 48-hour flood test.');
    if (i.below === 'unsure') add('amber', 'Check what is under the new bathroom; leaks into a room below are the most common failure.');
  }
  if (i.shaft === 'no') add('amber', 'No plumbing shaft nearby: new vertical lines and core-cutting will add cost and time.');
  else if (i.shaft === 'unsure') add('amber', 'Confirm whether a plumbing shaft is nearby — it can noticeably reduce cost.');
  else add('green', 'A nearby plumbing shaft keeps new pipework short and cheaper.');
  if (i.ventilation === 'none') add('amber', 'No window or outside wall: you will need a mechanical exhaust with a duct to outside to control damp.');

  const level = reasons.reduce<Level>((l, r) => worst(l, r.level), 'green');
  const steps = level === 'red' ? [
    'Get a plumber to measure levels before deciding — the layout may need to change.',
    'Ask about a sump/ejector pump or a different location closer to the drain.',
    'Book a Housy site visit so an expert can propose options with costs.',
  ] : level === 'amber' ? [
    'Have the drain distance and levels measured on site.',
    'Decide floor build-up (raised floor or sunk slab) before ordering fixtures.',
    'Plan waterproofing and a flood test before tiling.',
    'Book a Housy site visit to lock a fixed quote.',
  ] : [
    'Confirm levels with a plumber, then finalise the layout and fixtures.',
    'Waterproof and flood-test before tiling.',
    'Book a Housy site visit for a fixed quote.',
  ];
  const headline = level === 'green' ? 'Looks feasible' : level === 'amber' ? 'Feasible with some planning' : 'Needs an expert’s eye before you commit';
  return { level, headline, reasons, steps, professional: 'plumber', fallInches: fall };
}
