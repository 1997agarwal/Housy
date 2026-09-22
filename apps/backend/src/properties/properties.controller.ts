import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property profile' })
  create(@Req() req, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties for the logged-in user' })
  findMine(@Req() req) {
    return this.propertiesService.findByOwner(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single property by ID' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.propertiesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property details or renovation scope' })
  update(@Param('id') id: string, @Req() req, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, req.user.id, dto);
  }
}
