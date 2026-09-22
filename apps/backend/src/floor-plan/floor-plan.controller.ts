import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FloorPlanService } from './floor-plan.service';
import { AnalyzeRoomPhotosDto, SaveFloorPlanDto } from './dto/floor-plan.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Floor Plan')
@Controller('floor-plan')
export class FloorPlanController {
  constructor(private readonly floorPlanService: FloorPlanService) {}

  @Post('analyze-photos')
  @ApiOperation({ summary: 'Analyze room photos via AI vision to detect dimensions & features' })
  analyzePhotos(@Body() dto: AnalyzeRoomPhotosDto) {
    return this.floorPlanService.analyzeRoomPhotos(dto);
  }

  @Post('property/:propertyId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Save generated 2D floor plan for a property' })
  saveFloorPlan(
    @Param('propertyId') propertyId: string,
    @Body() dto: SaveFloorPlanDto,
    @Req() req,
  ) {
    return this.floorPlanService.saveFloorPlan(req.user.id, { ...dto, property_id: propertyId });
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get current 2D floor plan layout for property' })
  getFloorPlan(@Param('propertyId') propertyId: string) {
    return this.floorPlanService.getFloorPlan(propertyId);
  }
}
