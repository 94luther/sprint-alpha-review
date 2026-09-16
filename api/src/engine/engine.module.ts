import { Module } from '@nestjs/common';
import { EngineController } from './engine.controller';
import { EngineService } from './engine.service';

/**
 * The module that finally gives the rules layer a way in. Before 16 September
 * 2026 liquor, handover, offline, parcel, tracking, network, till, ops and
 * corporate were tested and reachable from nothing that serves a request.
 */
@Module({
  controllers: [EngineController],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
