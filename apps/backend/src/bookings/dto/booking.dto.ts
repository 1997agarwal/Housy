import { IsString, IsArray, IsDateString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkerSkill, BookingStatus } from '@housy/shared';

export class CreateBookingDto {
  @ApiProperty({ example: '22222222-2222-2222-2222-222222222201' })
  @IsString()
  poc_id: string;

  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  project_id: string;

  @ApiProperty({ example: ['mason', 'demolition'] })
  @IsArray()
  skills_required: WorkerSkill[];

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2026-10-04' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ example: 850 })
  @IsNumber()
  @Min(100)
  daily_rate: number;

  @ApiProperty({ example: 'Need to break drawing room wall (approx 12ft) and build an arch with smooth plastering.' })
  @IsString()
  work_description: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: ['pending', 'accepted', 'declined', 'active', 'completed', 'cancelled'] })
  @IsEnum(['pending', 'accepted', 'declined', 'active', 'completed', 'cancelled'])
  status: BookingStatus;
}
