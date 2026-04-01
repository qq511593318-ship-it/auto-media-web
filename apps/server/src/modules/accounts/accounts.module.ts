import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { PlatformValidatorService } from './platform-validator.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, PlatformValidatorService],
})
export class AccountsModule {}
