// ─────────────────────────────────────────────
// HOUSY — Shared Types
// Used across: mobile, web, backend
// ─────────────────────────────────────────────

// ── Enums ──────────────────────────────────────

export type UserRole = 'homeowner' | 'poc' | 'supervisor' | 'field_agent' | 'admin';
export type LanguagePref = 'en' | 'hi';
export type PropertyType = 'house' | 'apartment' | 'plot';

export type RenovationScope =
  | 'bathroom_addition'
  | 'bathroom_renovation'
  | 'kitchen_renovation'
  | 'wall_demolition'
  | 'flooring'
  | 'electrical'
  | 'plumbing'
  | 'waterproofing'
  | 'painting'
  | 'doors_windows'
  | 'structural_repair';

export type WorkerSkill =
  | 'mason'
  | 'plumber'
  | 'electrician'
  | 'tiles_fixer'
  | 'painter'
  | 'carpenter'
  | 'waterproofing'
  | 'false_ceiling'
  | 'demolition'
  | 'steel_fixer';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'active'
  | 'completed'
  | 'cancelled';

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed';

export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'needs_inspection';

export type FeasibilityLevel = 'high' | 'medium' | 'low' | 'needs_expert';

// ── Core Entities ───────────────────────────────

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  city: string;
  role: UserRole;
  language_pref: LanguagePref;
  phone_verified: boolean;
  aadhaar_verified: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  city: string;
  locality: string;
  pincode: string;
  type: PropertyType;
  age_years: number;
  sq_ft: number;
  bhk: number;
  bathrooms: number;
  renovation_scope: RenovationScope[];
  photos: string[];
  floor_plan_url?: string;
  created_at: string;
}

export interface POCProfile {
  id: string;
  user_id: string;
  gang_size: number;
  skills_available: WorkerSkill[];
  primary_skill: WorkerSkill;
  daily_rate_min: number;
  daily_rate_max: number;
  areas_served: string[];
  years_experience: number;
  languages: string[];
  bio: string;
  work_photos: string[];
  rating_avg: number;
  review_count: number;
  is_verified: boolean;
  housy_id_card_number?: string;
  is_available: boolean;
}

export interface Project {
  id: string;
  property_id: string;
  homeowner_id: string;
  title: string;
  status: ProjectStatus;
  budget_estimate: number;
  budget_spent: number;
  start_date: string;
  end_date_estimate?: string;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  assigned_poc_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  project_id: string;
  poc_id: string;
  homeowner_id: string;
  skills_required: WorkerSkill[];
  start_date: string;
  end_date: string;
  daily_rate: number;
  status: BookingStatus;
  work_description: string;
  platform_fee_pct: number;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  quality_rating: number;      // 1-5
  punctuality_rating: number;  // 1-5
  behaviour_rating: number;    // 1-5
  value_rating: number;        // 1-5
  overall_rating: number;      // computed avg
  text?: string;
  photos: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'voice' | 'image';
  read_at?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  logged_by: string;
  category: 'labor' | 'material' | 'equipment' | 'professional' | 'misc';
  description: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer';
  receipt_url?: string;
  created_at: string;
}

export interface SitePhoto {
  id: string;
  project_id: string;
  uploaded_by: string;
  url: string;
  room_tag?: string;
  task_tag?: string;
  notes?: string;
  taken_at: string;
  created_at: string;
}

// ── AI Advisor Types ─────────────────────────────

export interface FeasibilityResult {
  level: FeasibilityLevel;
  summary: string;
  complications: string[];
  next_steps: string[];
  cost_range_min: number;
  cost_range_max: number;
  recommend_professional: boolean;
  professional_type?: string;
}

export interface MaterialCalculation {
  property_id: string;
  scope: RenovationScope;
  area_sq_ft: number;
  items: MaterialItem[];
  generated_at: string;
}

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  rate_min: number;
  rate_max: number;
  total_min: number;
  total_max: number;
  brand_suggestions?: string[];
}

export interface BudgetEstimate {
  property_id: string;
  city: string;
  scopes: RenovationScope[];
  quality_tier: 'economy' | 'standard' | 'premium';
  labor_min: number;
  labor_max: number;
  material_min: number;
  material_max: number;
  equipment_min: number;
  equipment_max: number;
  contingency_pct: number;
  total_min: number;
  total_max: number;
  generated_at: string;
}

// ── Floor Plan Types ────────────────────────────

export type RoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living'
  | 'dining'
  | 'balcony'
  | 'corridor'
  | 'utility';

export interface RoomDoor {
  wall: 'north' | 'south' | 'east' | 'west';
  width_ft?: number;
  position_pct?: number; // 0 to 100 along the wall
}

export interface RoomWindow {
  wall: 'north' | 'south' | 'east' | 'west';
  width_ft?: number;
  position_pct?: number;
}

export interface RoomLayout {
  id: string;
  name: string;
  type: RoomType;
  length_ft: number;
  width_ft: number;
  area_sq_ft: number;
  x?: number; // Grid layout position
  y?: number;
  doors?: RoomDoor[];
  windows?: RoomWindow[];
  has_plumbing?: boolean;
  has_electrical?: boolean;
  is_renovation_target?: boolean;
  renovation_type?: 'wall_demolition' | 'new_bathroom' | 'flooring' | 'tiling';
  renovation_notes?: string;
  scanned_photos?: string[];
}

export interface FloorPlan {
  id: string;
  property_id: string;
  total_area_sq_ft: number;
  rooms: RoomLayout[];
  scan_method: 'camera_ai' | 'manual_wizard';
  existing_drainage_room_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ScanRoomAIResponse {
  room_name: string;
  room_type: RoomType;
  estimated_length_ft: number;
  estimated_width_ft: number;
  estimated_area_sq_ft: number;
  confidence: number;
  detected_features: string[];
  has_visible_plumbing: boolean;
  has_visible_beams: boolean;
  notes: string;
}

// ── API Response Wrappers ────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

