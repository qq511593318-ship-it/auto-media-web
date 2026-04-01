import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';
import { accounts, drafts, hotspots, skills, systemConfig } from '../src/mock/data';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers === 0) {
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword('change-me-before-production'),
      },
    });
  }

  const existingConfig = await prisma.systemConfig.count();
  if (existingConfig === 0) {
    await prisma.systemConfig.create({
      data: {
        aiProvider: systemConfig.aiProvider,
        defaultModel: systemConfig.defaultModel,
        apiBaseUrl: systemConfig.apiBaseUrl,
        apiKey: systemConfig.apiKey,
        browserPath: systemConfig.browserPath,
        promptDefaults: systemConfig.promptDefaults,
        hideRevenueByDefault: systemConfig.hideRevenueByDefault,
        publishRequiresPreview: systemConfig.publishRequiresPreview,
      },
    });
  } else {
    await prisma.systemConfig.updateMany({
      data: {
        aiProvider: systemConfig.aiProvider,
        defaultModel: systemConfig.defaultModel,
        apiBaseUrl: systemConfig.apiBaseUrl,
        apiKey: systemConfig.apiKey,
        browserPath: systemConfig.browserPath,
        promptDefaults: systemConfig.promptDefaults,
        hideRevenueByDefault: systemConfig.hideRevenueByDefault,
        publishRequiresPreview: systemConfig.publishRequiresPreview,
      },
    });
  }

  for (const account of accounts) {
    await prisma.platformAccount.upsert({
      where: { id: account.id },
      update: {
        platform: account.platform,
        displayName: account.displayName,
        fansCount: account.fansCount,
        revenueYesterday: account.revenueYesterday,
        hideRevenue: account.hideRevenue,
        credentialStatus: account.credentialStatus,
        lastValidatedAt: new Date(account.lastValidatedAt),
        isDefault: account.id === 'tt-1',
      },
      create: {
        id: account.id,
        platform: account.platform,
        displayName: account.displayName,
        fansCount: account.fansCount,
        revenueYesterday: account.revenueYesterday,
        hideRevenue: account.hideRevenue,
        credentialStatus: account.credentialStatus,
        lastValidatedAt: new Date(account.lastValidatedAt),
        isDefault: account.id === 'tt-1',
      },
    });
  }

  for (const hotspot of hotspots) {
    await prisma.hotspot.upsert({
      where: { id: hotspot.id },
      update: {
        source: hotspot.source,
        title: hotspot.title,
        score: hotspot.score,
        canGenerate: hotspot.canGenerate,
      },
      create: {
        id: hotspot.id,
        source: hotspot.source,
        title: hotspot.title,
        score: hotspot.score,
        canGenerate: hotspot.canGenerate,
      },
    });
  }

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: {
        name: skill.name,
        description: skill.name,
        targetPlatforms: JSON.stringify(skill.targetPlatforms),
        status: skill.status,
      },
      create: {
        id: skill.id,
        name: skill.name,
        description: skill.name,
        targetPlatforms: JSON.stringify(skill.targetPlatforms),
        status: skill.status,
      },
    });
  }

  for (const draft of drafts) {
    await prisma.draft.upsert({
      where: { id: draft.id },
      update: {
        title: draft.title,
        platform: draft.platform,
        status: draft.status,
        content: '',
      },
      create: {
        id: draft.id,
        title: draft.title,
        platform: draft.platform,
        status: draft.status,
        content: '',
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
