import { FloorPlan, RoomLayout } from '@housy/shared';

export const SAMPLE_BAREILLY_FLOOR_PLAN: FloorPlan = {
  id: 'FP-BAREILLY-001',
  property_id: 'default-bareilly-property',
  total_area_sq_ft: 2000,
  scan_method: 'camera_ai',
  existing_drainage_room_id: 'room-bath-1',
  created_at: '2026-09-20T10:00:00Z',
  updated_at: '2026-09-22T12:00:00Z',
  rooms: [
    {
      id: 'room-living',
      name: 'Living Hall & Courtyard',
      type: 'living',
      length_ft: 20,
      width_ft: 15,
      area_sq_ft: 300,
      x: 0,
      y: 0,
      doors: [{ wall: 'south', position_pct: 50 }],
      windows: [{ wall: 'north', position_pct: 30 }, { wall: 'north', position_pct: 70 }],
      has_plumbing: false,
      has_electrical: true,
    },
    {
      id: 'room-bed-1',
      name: 'Master Bedroom',
      type: 'bedroom',
      length_ft: 15,
      width_ft: 13,
      area_sq_ft: 195,
      x: 20,
      y: 0,
      doors: [{ wall: 'west', position_pct: 20 }],
      windows: [{ wall: 'east', position_pct: 50 }],
      has_plumbing: false,
      has_electrical: true,
    },
    {
      id: 'room-bed-2',
      name: 'Bedroom 2 (Adjacent to Bath)',
      type: 'bedroom',
      length_ft: 14,
      width_ft: 12,
      area_sq_ft: 168,
      x: 0,
      y: 15,
      doors: [{ wall: 'north', position_pct: 80 }],
      windows: [{ wall: 'south', position_pct: 50 }],
      has_plumbing: false,
      has_electrical: true,
      is_renovation_target: true,
      renovation_type: 'new_bathroom',
      renovation_notes: 'Partition 6x7 ft corner for attached 2nd bathroom.',
    },
    {
      id: 'room-bath-1',
      name: 'Existing Bathroom (Single in House)',
      type: 'bathroom',
      length_ft: 8,
      width_ft: 6,
      area_sq_ft: 48,
      x: 14,
      y: 15,
      doors: [{ wall: 'north', position_pct: 50 }],
      windows: [{ wall: 'south', position_pct: 50 }],
      has_plumbing: true,
      has_electrical: true,
    },
    {
      id: 'room-kitchen',
      name: 'Kitchen',
      type: 'kitchen',
      length_ft: 12,
      width_ft: 9,
      area_sq_ft: 108,
      x: 22,
      y: 15,
      doors: [{ wall: 'west', position_pct: 30 }],
      windows: [{ wall: 'east', position_pct: 50 }],
      has_plumbing: true,
      has_electrical: true,
    },
    {
      id: 'room-bed-3',
      name: 'Bedroom 3 (Front)',
      type: 'bedroom',
      length_ft: 14,
      width_ft: 12,
      area_sq_ft: 168,
      x: 0,
      y: 27,
      doors: [{ wall: 'north', position_pct: 20 }],
      windows: [{ wall: 'south', position_pct: 60 }],
      has_plumbing: false,
      has_electrical: true,
    },
  ],
};

/**
 * Calculates straight line and pipe routing distance between two rooms in feet
 */
export function calculateDrainageDistance(
  sourceRoom: RoomLayout,
  targetRoom: RoomLayout
): { distance_ft: number; est_pipe_cost: number; trenching_required: boolean } {
  const sx = sourceRoom.x ?? 0;
  const sy = sourceRoom.y ?? 0;
  const tx = targetRoom.x ?? 0;
  const ty = targetRoom.y ?? 0;

  // Manhattan routing along walls
  const distance = Math.round(Math.abs(tx - sx) + Math.abs(ty - sy));
  // Standard PVC CPVC drainage pipe + trenching per foot in UP: ~₹450/ft
  const pipeCost = distance * 480;

  return {
    distance_ft: distance,
    est_pipe_cost: pipeCost,
    trenching_required: distance > 8,
  };
}
