import { Module } from '@nestjs/common';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { HotspotsModule } from './modules/hotspots/hotspots.module';
import { ImagesModule } from './modules/images/images.module';
import { SkillsModule } from './modules/skills/skills.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ConfigModule,
    AccountsModule,
    HotspotsModule,
    ImagesModule,
    SkillsModule,
    DraftsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
