import { IsString, IsArray, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomType, RoomLayout } from '@housy/shared';

export class AnalyzeRoomPhotosDto {
  @ApiProperty({ example: 'Master Bedroom' })
  @IsString()
  room_name: string;

  @ApiProperty({ enum: ['bedroom', 'bathroom', 'kitchen', 'living', 'dining', 'balcony', 'corridor', 'utility'] })
  @IsString()
  room_type: RoomType;

  @ApiProperty({ description: 'Array of base64 data URLs or image URLs captured from 4 corners of the room', example: [] })
  @IsArray()
  photos: string[];

  @ApiPropertyOptional({ example: 'Typical 10ft ceiling height, 1 visible window on north wall' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaveFloorPlanDto {
  @ApiProperty({ example: 'property-uuid-here' })
  @IsString()
  property_id: string;

  @ApiProperty({ example: 'camera_ai' })
  @IsEnum(['camera_ai', 'manual_wizard'])
  scan_method: 'camera_ai' | 'manual_wizard';

  @ApiProperty({ description: 'Array of RoomLayout objects' })
  @IsArray()
  rooms: RoomLayout[];

  @ApiPropertyOptional({ example: 'bathroom-1-id' })
  @IsOptional()
  @IsString()
  existing_drainage_room_id?: string;
}
