import { Module } from '@nestjs/common';
import { PocController } from './poc.controller';
import { PocService } from './poc.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PocController],
  providers: [PocService],
  exports: [PocService],
})
export class PocModule {}
