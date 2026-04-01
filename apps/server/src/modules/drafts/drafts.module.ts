import { Module } from '@nestjs/common';
import { DraftsController } from './drafts.controller';
import { DraftGeneratorService } from './draft-generator.service';
import { DraftsService } from './drafts.service';

@Module({
  controllers: [DraftsController],
  providers: [DraftsService, DraftGeneratorService],
})
export class DraftsModule {}
