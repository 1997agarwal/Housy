import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new labor booking and dispatch WhatsApp notification to POC' })
  create(@Req() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all bookings for the logged-in homeowner' })
  findMine(@Req() req) {
    return this.bookingsService.findByHomeowner(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.bookingsService.findOne(id, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status (accept, decline, complete)' })
  updateStatus(@Param('id') id: string, @Req() req, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status, req.user.id);
  }
}
