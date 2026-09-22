import { IsString, IsNumber, IsArray, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyType, RenovationScope } from '@housy/shared';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Bareilly' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Civil Lines' })
  @IsString()
  locality: string;

  @ApiProperty({ example: '243001' })
  @IsString()
  pincode: string;

  @ApiProperty({ enum: ['house', 'apartment', 'plot'] })
  @IsEnum(['house', 'apartment', 'plot'])
  type: PropertyType;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0) @Max(150)
  age_years: number;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(100)
  sq_ft: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1) @Max(20)
  bhk: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0) @Max(10)
  bathrooms: number;

  @ApiProperty({ example: ['bathroom_addition', 'flooring'] })
  @IsArray()
  renovation_scope: RenovationScope[];

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class UpdatePropertyDto {
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() locality?: string;
  @IsOptional() @IsArray() renovation_scope?: RenovationScope[];
  @IsOptional() @IsArray() photos?: string[];
  @IsOptional() @IsString() floor_plan_url?: string;
  @IsOptional() @IsNumber() sq_ft?: number;
  @IsOptional() @IsNumber() bhk?: number;
  @IsOptional() @IsNumber() bathrooms?: number;
}
