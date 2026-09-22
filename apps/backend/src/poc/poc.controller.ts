import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PocService } from './poc.service';
import { QueryPocDto } from './dto/poc.dto';

@ApiTags('POC')
@Controller('poc')
export class PocController {
  constructor(private readonly pocService: PocService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter verified labor POCs' })
  findAll(@Query() query: QueryPocDto) {
    return this.pocService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get top-rated verified POCs for city' })
  getFeatured(@Query('city') city?: string) {
    return this.pocService.getFeatured(city);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complete POC profile including past work & reviews' })
  findOne(@Param('id') id: string) {
    return this.pocService.findOne(id);
  }
}
