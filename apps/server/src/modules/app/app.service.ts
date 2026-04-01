import { Injectable } from '@nestjs/common';
import { dashboardSummary } from '../../mock/data';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
    };
  }

  async getOverview() {
    const [accounts, hotspots, drafts, skills] = await Promise.all([
      this.prisma.platformAccount.count(),
      this.prisma.hotspot.count(),
      this.prisma.draft.count(),
      this.prisma.skill.count(),
    ]);

    return {
      ...dashboardSummary,
      counts: {
        accounts,
        hotspots,
        drafts,
        skills,
      },
    };
  }
}
