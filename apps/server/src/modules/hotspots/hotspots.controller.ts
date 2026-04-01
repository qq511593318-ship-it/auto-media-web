import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { HotspotsService } from './hotspots.service';

class ScanHotspotsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];
}

@Controller('hotspots')
export class HotspotsController {
  constructor(private readonly hotspotsService: HotspotsService) {}

  @Get()
  async findAll() {
    return this.hotspotsService.findAll();
  }

  @Post('clear')
  async clear() {
    return this.hotspotsService.clearAll();
  }

  @Post('scan')
  async scan(@Body() body: ScanHotspotsDto) {
    return this.hotspotsService.scanAndRefresh(body.sources || []);
  }
}
