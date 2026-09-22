import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { PocModule } from './poc/poc.module';
import { BookingsModule } from './bookings/bookings.module';
import { ProjectsModule } from './projects/projects.module';
import { AiAdvisorModule } from './ai-advisor/ai-advisor.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { UploadsModule } from './uploads/uploads.module';

import { NotificationsModule } from './notifications/notifications.module';
import { FloorPlanModule } from './floor-plan/floor-plan.module';

@Module({
  imports: [
    // Config — loads .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — 100 req/min per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Core
    SupabaseModule,
    NotificationsModule,
    AuthModule,
    PropertiesModule,
    PocModule,
    BookingsModule,
    ProjectsModule,
    FloorPlanModule,
    AiAdvisorModule,
    ReviewsModule,
    ChatModule,
    UploadsModule,
  ],
})
export class AppModule {}
