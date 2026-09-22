import { IsString, IsPhoneNumber, IsOptional, IsIn, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@housy/shared';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: 'Harshita G', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'homeowner', required: false })
  @IsOptional()
  @IsIn(['homeowner', 'poc', 'supervisor', 'field_agent', 'admin'])
  role?: UserRole;
}
