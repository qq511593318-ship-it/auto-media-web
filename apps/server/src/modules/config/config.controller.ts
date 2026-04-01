import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ConfigService } from './config.service';

class UpdateConfigDto {
  @IsString()
  aiProvider!: string;

  @IsString()
  defaultModel!: string;

  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  browserPath?: string;

  @IsOptional()
  @IsString()
  promptDefaults?: string;

  @IsBoolean()
  hideRevenueByDefault!: boolean;

  @IsBoolean()
  publishRequiresPreview!: boolean;
}

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  @Put()
  async updateConfig(@Body() body: UpdateConfigDto) {
    return this.configService.updateConfig(body);
  }
}
