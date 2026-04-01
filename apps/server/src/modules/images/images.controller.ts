import { Controller, Get, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ImagesService } from './images.service';

class SearchImagesDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get('search')
  async search(@Query() query: SearchImagesDto) {
    return this.imagesService.search(query.q, query.limit);
  }
}
