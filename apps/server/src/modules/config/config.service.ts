import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type UpdateConfigInput = {
  aiProvider: string;
  defaultModel: string;
  apiBaseUrl?: string;
  apiKey?: string;
  browserPath?: string;
  promptDefaults?: string;
  hideRevenueByDefault: boolean;
  publishRequiresPreview: boolean;
};

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    return this.prisma.systemConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateConfig(input: UpdateConfigInput) {
    const existing = await this.prisma.systemConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!existing) {
      return this.prisma.systemConfig.create({
        data: input,
      });
    }

    return this.prisma.systemConfig.update({
      where: { id: existing.id },
      data: input,
    });
  }
}
