import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HotspotScanService } from './hotspot-scan.service';

@Injectable()
export class HotspotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hotspotScan: HotspotScanService,
  ) {}

  async findAll() {
    return this.prisma.hotspot.findMany({
      orderBy: [{ fetchedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async clearAll() {
    await this.prisma.hotspot.deleteMany({});
    return this.findAll();
  }

  async scanAndRefresh(sources: string[]) {
    const normalized = sources.length ? sources : ['toutiao', 'baidu', 'google'];
    const items = await this.hotspotScan.scanSources(normalized);

    for (const source of normalized) {
      await this.prisma.hotspot.deleteMany({
        where: { source },
      });
    }

    if (items.length) {
      await this.prisma.hotspot.createMany({
        data: items.map((item) => ({
          id: item.id,
          source: item.source,
          title: item.title,
          summary: item.summary || '',
          score: item.score || '',
          rawUrl: item.rawUrl || '',
          canGenerate: item.canGenerate,
          fetchedAt: new Date(),
        })),
      });
    }

    return this.findAll();
  }
}
