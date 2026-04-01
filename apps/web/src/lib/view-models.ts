import type { AccountRecord, ConfigRecord, DraftRecord, HotspotRecord, SkillRecord } from './api';

const platformLabels: Record<string, string> = {
  toutiao: '今日头条',
  baijiahao: '百家号',
  wechat: '微信公众号',
};

const statusLabels: Record<string, string> = {
  valid: 'Cookie 有效',
  expired: '待重新验证',
  pending: '待校验',
};

const toneLabels: Record<string, 'ok' | 'warn' | 'idle'> = {
  valid: 'ok',
  expired: 'warn',
  pending: 'idle',
};

export function formatAccountCard(account: AccountRecord) {
  const platform = platformLabels[account.platform] || account.platform;
  const revenue = account.hideRevenue ? '已隐藏' : `¥${account.revenueYesterday}`;

  return {
    id: account.id,
    platform,
    handle: account.displayName,
    fans: account.fansCount.toLocaleString('zh-CN'),
    revenue,
    status: statusLabels[account.credentialStatus] || account.credentialStatus,
    statusTone: toneLabels[account.credentialStatus] || 'idle',
    lastSync: account.lastValidatedAt
      ? new Date(account.lastValidatedAt).toLocaleString('zh-CN', { hour12: false })
      : '未开始',
    publishState: account.isDefault ? '默认执行账号' : '普通账号',
    summary: account.isDefault ? '当前默认执行账号。' : '可在生成和发布时切换调用。',
  };
}

export function formatHotspotCard(hotspot: HotspotRecord) {
  const summary = (hotspot.summary || '').trim();
  const imageQuery = [hotspot.title, summary]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 140);

  return {
    id: hotspot.id,
    source: hotspot.source,
    title: hotspot.title,
    summary,
    heat: hotspot.score || 'N/A',
    angle: hotspot.canGenerate ? '可直接进入生成流程' : '仅供观察',
    imageQuery,
    tags: [hotspot.source, hotspot.canGenerate ? '可生成' : '观察中'],
  };
}

export function formatSkillCard(skill: SkillRecord) {
  return {
    id: skill.id,
    name: skill.name,
    platform: skill.targetPlatforms.map((item) => platformLabels[item] || item).join(' / '),
    summary: skill.description,
    lastRun: skill.status,
    inputs: skill.targetPlatforms,
  };
}

export function formatDraftCard(draft: DraftRecord) {
  return {
    id: draft.id,
    title: draft.title,
    platform: platformLabels[draft.platform] || draft.platform,
    state: draft.status,
    owner: draft.ownerName || '未分配',
  };
}

export function buildConfigForm(config: ConfigRecord | null) {
  return {
    aiProvider: config?.aiProvider || 'doubao',
    defaultModel: config?.defaultModel || '',
    apiBaseUrl: config?.apiBaseUrl || '',
    apiKey: config?.apiKey || '',
    browserPath: config?.browserPath || '',
    promptDefaults: config?.promptDefaults || '',
    hideRevenueByDefault: config?.hideRevenueByDefault || false,
    publishRequiresPreview: config?.publishRequiresPreview ?? true,
  };
}
