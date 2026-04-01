import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { DraftsService } from './drafts.service';

class GenerateDraftDto {
  @IsString()
  hotspotId!: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}

@Controller('drafts')
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Get()
  async findAll() {
    return this.draftsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.draftsService.findOne(id);
  }

  @Post('generate-from-hotspot')
  async generateFromHotspot(@Body() body: GenerateDraftDto) {
    return this.draftsService.generateFromHotspot(body);
  }
}
