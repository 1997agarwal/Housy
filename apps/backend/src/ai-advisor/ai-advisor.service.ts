import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RenovationScope, FeasibilityResult, BudgetEstimate, MaterialCalculation } from '@housy/shared';

// City-calibrated labor rates (₹/day) — Tier 2 UP baseline (Bareilly)
const CITY_RATES: Record<string, Record<string, { min: number; max: number }>> = {
  bareilly: {
    mason:        { min: 600,  max: 900  },
    plumber:      { min: 700,  max: 1100 },
    electrician:  { min: 700,  max: 1100 },
    tiles_fixer:  { min: 650,  max: 950  },
    painter:      { min: 500,  max: 750  },
    carpenter:    { min: 700,  max: 1000 },
  },
  lucknow: {
    mason:        { min: 700,  max: 1100 },
    plumber:      { min: 800,  max: 1200 },
    electrician:  { min: 800,  max: 1300 },
    tiles_fixer:  { min: 750,  max: 1100 },
    painter:      { min: 600,  max: 900  },
    carpenter:    { min: 800,  max: 1200 },
  },
};

// Material rates (₹/unit) — Bareilly market baseline
const MATERIAL_RATES = {
  cement_bag_50kg: { min: 340, max: 390 },    // per bag
  brick_red:       { min: 7,   max: 10  },    // per piece
  brick_fly_ash:   { min: 6,   max: 9   },    // per piece
  sand_cft:        { min: 45,  max: 65  },    // per cubic foot
  tile_sqft:       { min: 35,  max: 120 },    // per sq ft (economy–standard)
  paint_litre:     { min: 120, max: 350 },    // per litre (economy–premium)
};

@Injectable()
export class AiAdvisorService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: `You are Housy AI, a renovation advisor for Indian homeowners.
You have deep expertise in Indian construction practices, IS codes, and local market conditions.
You specialize in Tier 2 cities, especially Uttar Pradesh.

Rules:
1. Always give practical, actionable advice grounded in Indian construction reality.
2. For ANY structural decision (load-bearing walls, foundations, slabs), ALWAYS recommend a professional engineer consultation. Never approve structural demolition without this caveat.
3. Give cost estimates in Indian Rupees (₹). Use lakh notation (₹1L = ₹1,00,000).
4. Be concise and clear. Use simple English.
5. Always end with "Next step:" telling the user exactly what to do right now.
6. If unsure, say so — never make up facts about construction.`,
    });
  }

  // ── Freeform Chat ─────────────────────────────────────────
  async chat(message: string, history: { role: string; content: string }[] = []): Promise<string> {
    const chat = this.model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  }

  // ── Bathroom Addition Feasibility ─────────────────────────
  async analyzeBathroomAddition(params: {
    property_sq_ft: number;
    current_bathrooms: number;
    proposed_location: string;          // e.g. "adjacent to bedroom 3"
    distance_from_existing_ft: number;  // distance from nearest existing bathroom
    floor: number;                       // 0 = ground, 1 = first floor, etc.
    has_open_terrace_above: boolean;
    city: string;
  }): Promise<FeasibilityResult> {
    const prompt = `
Analyze feasibility of adding a new bathroom with these details:
- Property size: ${params.property_sq_ft} sq ft
- Current bathrooms: ${params.current_bathrooms}
- Proposed location: ${params.proposed_location}
- Distance from nearest existing bathroom: ${params.distance_from_existing_ft} feet
- Floor: ${params.floor === 0 ? 'Ground floor' : `Floor ${params.floor}`}
- Open terrace above: ${params.has_open_terrace_above ? 'Yes' : 'No'}
- City: ${params.city}

Respond in this EXACT JSON format (no markdown):
{
  "level": "high|medium|low|needs_expert",
  "summary": "2-3 sentence summary",
  "complications": ["complication 1", "complication 2"],
  "next_steps": ["step 1", "step 2", "step 3"],
  "cost_range_min": 180000,
  "cost_range_max": 320000,
  "recommend_professional": true|false,
  "professional_type": "plumber|structural_engineer|architect|null"
}`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text) as FeasibilityResult;
  }

  // ── Wall Breaking Feasibility ──────────────────────────────
  async analyzeWallBreaking(params: {
    wall_type: 'exterior' | 'interior';
    runs_parallel_to_slab: boolean;
    visible_beam_above: boolean;
    thickness_inches: number;
    construction_type: 'rcc_framed' | 'load_bearing_masonry' | 'unknown';
    city: string;
  }): Promise<FeasibilityResult> {
    const prompt = `
Analyze feasibility of breaking a wall with these details:
- Wall type: ${params.wall_type}
- Runs parallel to roof slab: ${params.runs_parallel_to_slab}
- Visible beam/lintel above: ${params.visible_beam_above}
- Wall thickness: ${params.thickness_inches} inches
- Construction type: ${params.construction_type}
- City: ${params.city}

A 9-inch or thicker wall in load-bearing masonry is almost certainly structural.
A 4.5-inch wall in RCC-framed construction is likely a partition wall.

Respond in this EXACT JSON format (no markdown):
{
  "level": "high|medium|low|needs_expert",
  "summary": "2-3 sentence assessment",
  "complications": ["complication 1"],
  "next_steps": ["step 1", "step 2"],
  "cost_range_min": 5000,
  "cost_range_max": 25000,
  "recommend_professional": true|false,
  "professional_type": "structural_engineer|null"
}`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text) as FeasibilityResult;
  }

  // ── Budget Estimator ───────────────────────────────────────
  async estimateBudget(params: {
    city: string;
    scopes: RenovationScope[];
    sq_ft: number;
    quality_tier: 'economy' | 'standard' | 'premium';
  }): Promise<BudgetEstimate> {
    const cityKey = params.city.toLowerCase().replace(/\s/g, '');
    const rates = CITY_RATES[cityKey] || CITY_RATES['bareilly'];

    // Simplified heuristic — real version would be scope-specific
    const sqFtFactor = params.sq_ft / 1000;
    const tierMultiplier = params.quality_tier === 'economy' ? 0.75
      : params.quality_tier === 'premium' ? 1.4 : 1.0;

    const base = params.scopes.length * 80000 * sqFtFactor;
    const labor_min = Math.round(base * 0.45 * 0.9 * tierMultiplier);
    const labor_max = Math.round(base * 0.45 * 1.15 * tierMultiplier);
    const material_min = Math.round(base * 0.45 * 0.9 * tierMultiplier);
    const material_max = Math.round(base * 0.45 * 1.15 * tierMultiplier);
    const equipment_min = Math.round(base * 0.05 * 0.9);
    const equipment_max = Math.round(base * 0.05 * 1.2);
    const contingency_pct = 18;

    const subtotal_min = labor_min + material_min + equipment_min;
    const subtotal_max = labor_max + material_max + equipment_max;

    return {
      property_id: '',
      city: params.city,
      scopes: params.scopes,
      quality_tier: params.quality_tier,
      labor_min,
      labor_max,
      material_min,
      material_max,
      equipment_min,
      equipment_max,
      contingency_pct,
      total_min: Math.round(subtotal_min * (1 + contingency_pct / 100)),
      total_max: Math.round(subtotal_max * (1 + contingency_pct / 100)),
      generated_at: new Date().toISOString(),
    };
  }

  // ── Material Calculator ────────────────────────────────────
  calculateMaterials(params: {
    scope: RenovationScope;
    area_sq_ft: number;
    wall_length_ft?: number;
    wall_height_ft?: number;
  }): MaterialCalculation {
    const items = [];
    const r = MATERIAL_RATES;

    if (params.scope === 'flooring') {
      const tilesNeeded = Math.ceil(params.area_sq_ft * 1.10); // 10% wastage
      items.push({
        name: 'Floor Tiles',
        quantity: tilesNeeded,
        unit: 'sq ft',
        rate_min: r.tile_sqft.min,
        rate_max: r.tile_sqft.max,
        total_min: tilesNeeded * r.tile_sqft.min,
        total_max: tilesNeeded * r.tile_sqft.max,
        brand_suggestions: ['Johnson Tiles', 'Kajaria', 'Somany'],
      });
      const cementBags = Math.ceil(params.area_sq_ft / 30);
      items.push({
        name: 'Cement (OPC 43)',
        quantity: cementBags,
        unit: 'bags (50kg)',
        rate_min: r.cement_bag_50kg.min,
        rate_max: r.cement_bag_50kg.max,
        total_min: cementBags * r.cement_bag_50kg.min,
        total_max: cementBags * r.cement_bag_50kg.max,
        brand_suggestions: ['Ultratech', 'ACC', 'Shree Cement'],
      });
    }

    if (params.scope === 'bathroom_addition' || params.scope === 'bathroom_renovation') {
      const wallArea = (params.wall_length_ft || 40) * (params.wall_height_ft || 9) * 2;
      const floorArea = params.area_sq_ft;
      const totalTiledArea = Math.ceil((wallArea + floorArea) * 1.10);
      items.push({
        name: 'Bathroom Tiles (wall + floor)',
        quantity: totalTiledArea,
        unit: 'sq ft',
        rate_min: r.tile_sqft.min,
        rate_max: r.tile_sqft.max * 1.2,
        total_min: totalTiledArea * r.tile_sqft.min,
        total_max: totalTiledArea * r.tile_sqft.max * 1.2,
        brand_suggestions: ['Johnson Tiles', 'Somany', 'Cera'],
      });
      const cementBags = Math.ceil(params.area_sq_ft / 20);
      items.push({
        name: 'Cement (OPC 43)',
        quantity: cementBags,
        unit: 'bags (50kg)',
        rate_min: r.cement_bag_50kg.min,
        rate_max: r.cement_bag_50kg.max,
        total_min: cementBags * r.cement_bag_50kg.min,
        total_max: cementBags * r.cement_bag_50kg.max,
        brand_suggestions: ['Ultratech', 'ACC'],
      });
      items.push({
        name: 'Sand',
        quantity: Math.ceil(params.area_sq_ft / 15),
        unit: 'cubic feet',
        rate_min: r.sand_cft.min,
        rate_max: r.sand_cft.max,
        total_min: Math.ceil(params.area_sq_ft / 15) * r.sand_cft.min,
        total_max: Math.ceil(params.area_sq_ft / 15) * r.sand_cft.max,
      });
    }

    if (params.scope === 'painting') {
      const paintableArea = (params.area_sq_ft || 0) * 3.5; // walls + ceiling approx
      const litresNeeded = Math.ceil(paintableArea / 50); // ~50 sqft/litre per coat × 2 coats
      items.push({
        name: 'Interior Emulsion Paint',
        quantity: litresNeeded,
        unit: 'litres',
        rate_min: r.paint_litre.min,
        rate_max: r.paint_litre.max,
        total_min: litresNeeded * r.paint_litre.min,
        total_max: litresNeeded * r.paint_litre.max,
        brand_suggestions: ['Asian Paints Tractor', 'Berger Bison', 'Dulux'],
      });
    }

    return {
      property_id: '',
      scope: params.scope,
      area_sq_ft: params.area_sq_ft,
      items,
      generated_at: new Date().toISOString(),
    };
  }
}
