import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PlatformValidatorService } from './platform-validator.service';

export type UpdateCredentialInput = {
  credentialBlob: string;
};

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformValidator: PlatformValidatorService,
  ) {}

  async findAll() {
    return this.prisma.platformAccount.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async validateAccount(id: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new Error('账号不存在');
    }

    const result = await this.platformValidator.validate(
      account.platform,
      account.credentialBlob || '',
    );

    return this.prisma.platformAccount.update({
      where: { id },
      data: {
        credentialStatus: result.success ? 'valid' : 'expired',
        lastValidatedAt: new Date(),
        displayName: result.success && result.name ? result.name : account.displayName,
      },
    });
  }

  async setDefaultAccount(id: string) {
    await this.prisma.$transaction([
      this.prisma.platformAccount.updateMany({
        data: { isDefault: false },
      }),
      this.prisma.platformAccount.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return this.findAll();
  }

  async updateCredential(id: string, input: UpdateCredentialInput) {
    return this.prisma.platformAccount.update({
      where: { id },
      data: {
        credentialBlob: input.credentialBlob,
        credentialStatus: input.credentialBlob.trim() ? 'pending' : 'expired',
      },
    });
  }

  async validateAllAccounts() {
    const accounts = await this.prisma.platformAccount.findMany({
      orderBy: { createdAt: 'asc' },
    });

    for (const account of accounts) {
      if (!account.credentialBlob?.trim()) {
        await this.prisma.platformAccount.update({
          where: { id: account.id },
          data: {
            credentialStatus: 'expired',
            lastValidatedAt: new Date(),
          },
        });
        continue;
      }

      const result = await this.platformValidator.validate(
        account.platform,
        account.credentialBlob,
      );

      await this.prisma.platformAccount.update({
        where: { id: account.id },
        data: {
          credentialStatus: result.success ? 'valid' : 'expired',
          lastValidatedAt: new Date(),
          displayName: result.success && result.name ? result.name : account.displayName,
        },
      });
    }

    return this.findAll();
  }
}
