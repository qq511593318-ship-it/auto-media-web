import { Injectable } from '@nestjs/common';
import * as path from 'path';

type ValidationResult = {
  success: boolean;
  name?: string;
  userid?: string;
  message?: string;
};

@Injectable()
export class PlatformValidatorService {
  async validate(platform: string, credential: string): Promise<ValidationResult> {
    if (!credential.trim()) {
      return { success: false, message: 'Cookie 为空' };
    }

    if (platform === 'baijiahao') {
      const mod = require(path.join(process.cwd(), 'src', 'baijiahao-api.js'));
      const api = new mod.BaijiahaoAPI(credential);
      return api.checkAuth();
    }

    if (platform === 'toutiao') {
      const mod = require(path.join(process.cwd(), 'src', 'toutiao-api.js'));
      const api = new mod.ToutiaoAPI(credential);
      return api.checkAuth();
    }

    if (platform === 'wechat') {
      const mod = require(path.join(process.cwd(), 'src', 'wechat-api.js'));
      const api = new mod.WechatAPI(credential);
      return api.checkAuth();
    }

    return { success: false, message: `不支持的平台: ${platform}` };
  }
}
