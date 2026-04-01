import { Skill as PrismaSkill } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = (await this.prisma.skill.findMany({
      orderBy: { createdAt: 'asc' },
    })) as PrismaSkill[];

    return rows.map((row: PrismaSkill) => ({
      ...row,
      targetPlatforms: JSON.parse(row.targetPlatforms) as string[],
    }));
  }
}
