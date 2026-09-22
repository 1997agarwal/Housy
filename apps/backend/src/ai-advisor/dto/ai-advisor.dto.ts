import { IsString, IsArray, IsOptional, IsNumber, IsBoolean, IsEnum, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RenovationScope } from '@housy/shared';

export class ChatDto {
  @ApiProperty({ example: 'Can I add a second bathroom near my bedroom?' })
  @IsString()
  message: string;

  @ApiProperty({ required: false, example: [] })
  @IsOptional()
  @IsArray()
  history?: { role: string; content: string }[];
}

export class BathroomFeasibilityDto {
  @IsNumber() property_sq_ft: number;
  @IsNumber() current_bathrooms: number;
  @IsString() proposed_location: string;
  @IsNumber() distance_from_existing_ft: number;
  @IsNumber() floor: number;
  @IsBoolean() has_open_terrace_above: boolean;
  @IsString() city: string;
}

export class WallBreakingDto {
  @IsIn(['exterior', 'interior']) wall_type: 'exterior' | 'interior';
  @IsBoolean() runs_parallel_to_slab: boolean;
  @IsBoolean() visible_beam_above: boolean;
  @IsNumber() thickness_inches: number;
  @IsIn(['rcc_framed', 'load_bearing_masonry', 'unknown'])
  construction_type: 'rcc_framed' | 'load_bearing_masonry' | 'unknown';
  @IsString() city: string;
}

export class BudgetEstimateDto {
  @IsString() city: string;
  @IsArray() scopes: RenovationScope[];
  @IsNumber() @Min(100) sq_ft: number;
  @IsIn(['economy', 'standard', 'premium']) quality_tier: 'economy' | 'standard' | 'premium';
}

export class MaterialCalculatorDto {
  @IsString() scope: RenovationScope;
  @IsNumber() @Min(10) area_sq_ft: number;
  @IsOptional() @IsNumber() wall_length_ft?: number;
  @IsOptional() @IsNumber() wall_height_ft?: number;
}
