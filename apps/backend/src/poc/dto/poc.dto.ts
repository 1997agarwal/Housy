import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkerSkill } from '@housy/shared';

export class QueryPocDto {
  @ApiPropertyOptional({ example: 'Bareilly' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Civil Lines' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ enum: ['mason', 'plumber', 'electrician', 'tiles_fixer', 'painter', 'carpenter', 'waterproofing', 'demolition'] })
  @IsOptional()
  @IsString()
  skill?: WorkerSkill;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_rate?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_rating?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
