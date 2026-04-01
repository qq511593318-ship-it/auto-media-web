import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { PrismaService } from '../database/prisma.service';

type SessionPayload = {
  username: string;
  role: 'admin';
  exp: number;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private getSecret() {
    return process.env.AUTH_SECRET || 'auto-media-dev-secret';
  }

  private sign(payload: SessionPayload) {
    return createHmac('sha256', this.getSecret())
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  private encode(payload: SessionPayload) {
    const raw = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const signature = this.sign(payload);
    return `${raw}.${signature}`;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${derived}`;
  }

  private isHashedPassword(value: string) {
    return value.startsWith('scrypt$');
  }

  private verifyPassword(password: string, stored: string) {
    if (!this.isHashedPassword(stored)) {
      return password === stored;
    }

    const [, salt, expected] = stored.split('$');
    if (!salt || !expected) {
      return false;
    }

    const actual = scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(actual, 'utf-8');
    const b = Buffer.from(expected, 'utf-8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private decode(token: string): SessionPayload {
    const [raw, signature] = token.split('.');
    if (!raw || !signature) {
      throw new UnauthorizedException('Token 无效');
    }

    const payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as SessionPayload;
    const expected = this.sign(payload);

    const a = Buffer.from(signature, 'utf-8');
    const b = Buffer.from(expected, 'utf-8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('签名无效');
    }

    if (payload.exp < Date.now()) {
      throw new UnauthorizedException('登录已过期');
    }

    return payload;
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!this.isHashedPassword(user.passwordHash)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: this.hashPassword(password),
        },
      });
    }

    const payload: SessionPayload = {
      username: user.username,
      role: 'admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    return {
      user: {
        username: payload.username,
        role: payload.role,
      },
      token: this.encode(payload),
    };
  }

  async verifyToken(token: string) {
    const payload = this.decode(token);
    const user = await this.prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      user: {
        username: payload.username,
        role: payload.role,
      },
    };
  }

  async changePassword(username: string, currentPassword: string, nextPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !this.verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('当前密码错误');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: this.hashPassword(nextPassword),
      },
    });

    return {
      success: true,
    };
  }
}
