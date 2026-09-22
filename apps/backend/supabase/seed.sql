-- =====================================================
-- HOUSY — Bareilly, UP Seed Data
-- Run this in: Supabase Dashboard → SQL Editor after schema.sql
-- =====================================================

-- 1. Create sample POC users (using consistent UUIDs for reference)
INSERT INTO public.users (id, phone, name, email, city, role, language_pref, phone_verified, aadhaar_verified)
VALUES
  ('11111111-1111-1111-1111-111111111101', '+919837012345', 'Suresh Mistri & Gang', 'suresh.mistri@example.com', 'Bareilly', 'poc', 'hi', true, true),
  ('11111111-1111-1111-1111-111111111102', '+919837023456', 'Ramesh Kumar (Jal Sansthan)', 'ramesh.plumber@example.com', 'Bareilly', 'poc', 'hi', true, true),
  ('11111111-1111-1111-1111-111111111103', '+919837034567', 'Mohammad Irfan & Sons', 'irfan.electric@example.com', 'Bareilly', 'poc', 'hi', true, true),
  ('11111111-1111-1111-1111-111111111104', '+919837045678', 'Dinesh Sharma (Tiles & Marble)', 'dinesh.tiles@example.com', 'Bareilly', 'poc', 'hi', true, true),
  ('11111111-1111-1111-1111-111111111105', '+919837056789', 'Pappu Painter & Artists', 'pappu.paint@example.com', 'Bareilly', 'poc', 'hi', true, true),
  ('11111111-1111-1111-1111-111111111106', '+919837067890', 'Satish Yadav Demolition & Civil', 'satish.civil@example.com', 'Bareilly', 'poc', 'hi', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city;

-- 2. Insert POC Profiles
INSERT INTO public.poc_profiles (
  id, user_id, gang_size, skills_available, primary_skill,
  daily_rate_min, daily_rate_max, areas_served, years_experience,
  languages, bio, work_photos, rating_avg, review_count, is_verified,
  housy_id_card_number, is_available
)
VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    12,
    ARRAY['mason', 'tiles_fixer', 'waterproofing', 'demolition'],
    'mason',
    750, 1200,
    ARRAY['Civil Lines', 'Rampur Garden', 'DD Puram', 'Subhash Nagar'],
    14,
    ARRAY['hi', 'en'],
    'Lead Mistri with 14 years experience handling complete residential renovations across Bareilly. Specializes in structural wall breaking, bathroom remodelling, brickwork, and plastering with a dedicated gang of 12 trained karigars.',
    ARRAY[
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=800',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'
    ],
    4.9, 38, true, 'HSY-BLY-001', true
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    4,
    ARRAY['plumber', 'waterproofing'],
    'plumber',
    800, 1100,
    ARRAY['Civil Lines', 'Rajendra Nagar', 'C.B. Ganj', 'Rampur Garden'],
    11,
    ARRAY['hi'],
    'Expert plumbing master for concealed CPVC/UPVC pipelines, drainage lines, overhead water tanks, and sanitary fittings. Known for timely completion and leak-proof installations.',
    ARRAY[
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800'
    ],
    4.8, 29, true, 'HSY-BLY-002', true
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    6,
    ARRAY['electrician'],
    'electrician',
    700, 1100,
    ARRAY['Subhash Nagar', 'DD Puram', 'Civil Lines', 'Izzatnagar'],
    9,
    ARRAY['hi', 'en'],
    'Concealed wiring, inverter setups, distribution board (DB) installation, and smart appliance fittings. Experienced in both old house rewiring and new extensions.',
    ARRAY[
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'
    ],
    4.7, 24, true, 'HSY-BLY-003', true
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111104',
    8,
    ARRAY['tiles_fixer', 'mason'],
    'tiles_fixer',
    850, 1300,
    ARRAY['DD Puram', 'Rajendra Nagar', 'Civil Lines', 'Rampur Garden'],
    12,
    ARRAY['hi'],
    'Specialist in large-format vitrified tiles, Italian marble polishing, kitchen counter granite cutting, and waterproof bathroom floor tiling with zero slope errors.',
    ARRAY[
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    4.9, 42, true, 'HSY-BLY-004', true
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111105',
    10,
    ARRAY['painter', 'waterproofing'],
    'painter',
    600, 900,
    ARRAY['Rajendra Nagar', 'Subhash Nagar', 'Civil Lines', 'C.B. Ganj'],
    8,
    ARRAY['hi'],
    'Complete exterior weather-coat painting, interior putty finish, royal texture walls, and damp-proof damp-stop chemical coating for old seepage-prone walls.',
    ARRAY[
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800'
    ],
    4.6, 19, true, 'HSY-BLY-005', true
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111106',
    14,
    ARRAY['demolition', 'mason', 'waterproofing'],
    'demolition',
    700, 1000,
    ARRAY['Izzatnagar', 'Civil Lines', 'Rampur Garden', 'DD Puram'],
    15,
    ARRAY['hi'],
    'Fast demolition & debris (malba) disposal service with heavy hammer equipment. Pre-demolition inspection to ensure safety of adjoining beams and pipes.',
    ARRAY[
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=800'
    ],
    4.8, 31, true, 'HSY-BLY-006', true
  )
ON CONFLICT (id) DO UPDATE SET
  gang_size = EXCLUDED.gang_size,
  daily_rate_min = EXCLUDED.daily_rate_min,
  daily_rate_max = EXCLUDED.daily_rate_max,
  rating_avg = EXCLUDED.rating_avg;

-- 3. Insert sample verified reviews
INSERT INTO public.reviews (
  id, booking_id, reviewer_id, reviewee_id,
  quality_rating, punctuality_rating, behaviour_rating, value_rating,
  text, photos
)
VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '00000000-0000-0000-0000-000000000000', -- standalone sample
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111101',
    5, 5, 5, 5,
    'Suresh Mistri and his team broke our 30-year-old drawing room wall and rebuilt the arch cleanly within 3 days. Very honest with material usage, did not waste cement.',
    ARRAY['https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=400']
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111101',
    5, 4, 5, 5,
    'Added an attached washroom on the first floor. Suresh gave good advice about drainage pipeline slope to avoid breaking our courtyard floor.',
    ARRAY[]::text[]
  )
ON CONFLICT (id) DO NOTHING;
