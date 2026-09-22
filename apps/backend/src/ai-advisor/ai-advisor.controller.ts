import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiAdvisorService } from './ai-advisor.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  ChatDto,
  BathroomFeasibilityDto,
  WallBreakingDto,
  BudgetEstimateDto,
  MaterialCalculatorDto,
} from './dto/ai-advisor.dto';

@ApiTags('AI Advisor')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ai-advisor')
export class AiAdvisorController {
  constructor(private readonly aiAdvisorService: AiAdvisorService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Freeform chat with Housy AI' })
  chat(@Body() dto: ChatDto) {
    return this.aiAdvisorService.chat(dto.message, dto.history);
  }

  @Post('bathroom-feasibility')
  @ApiOperation({ summary: 'Analyze feasibility of adding a bathroom' })
  bathroomFeasibility(@Body() dto: BathroomFeasibilityDto) {
    return this.aiAdvisorService.analyzeBathroomAddition(dto);
  }

  @Post('wall-breaking')
  @ApiOperation({ summary: 'Assess safety of breaking a wall' })
  wallBreaking(@Body() dto: WallBreakingDto) {
    return this.aiAdvisorService.analyzeWallBreaking(dto);
  }

  @Post('budget-estimate')
  @ApiOperation({ summary: 'Get a budget estimate for renovation scope' })
  budgetEstimate(@Body() dto: BudgetEstimateDto) {
    return this.aiAdvisorService.estimateBudget(dto);
  }

  @Post('material-calculator')
  @ApiOperation({ summary: 'Calculate materials needed for a renovation scope' })
  materialCalculator(@Body() dto: MaterialCalculatorDto) {
    return this.aiAdvisorService.calculateMaterials(dto);
  }
}
