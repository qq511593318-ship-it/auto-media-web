import { Module } from '@nestjs/common';
import { HotspotsController } from './hotspots.controller';
import { HotspotScanService } from './hotspot-scan.service';
import { HotspotsService } from './hotspots.service';

@Module({
  controllers: [HotspotsController],
  providers: [HotspotsService, HotspotScanService],
})
export class HotspotsModule {}
