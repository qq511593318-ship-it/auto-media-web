import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DraftGeneratorService } from './draft-generator.service';

@Injectable()
export class DraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly draftGenerator: DraftGeneratorService,
  ) {}

  async findAll() {
    return this.prisma.draft.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.draft.findUnique({
      where: { id },
    });
  }

  async generateFromHotspot(input: {
    hotspotId: string;
    platform?: string;
    accountId?: string;
  }) {
    return this.draftGenerator.generateFromHotspot(input);
  }
}
