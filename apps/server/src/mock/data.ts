export const dashboardSummary = {
  product: 'AI 自媒体运营工作台',
  mode: 'local-first',
  frontendPort: 8080,
  backendPort: 3001,
  modules: ['auth', 'config', 'accounts', 'hotspots', 'skills', 'drafts'],
};

export const accounts = [
  {
    id: 'tt-1',
    platform: 'toutiao',
    displayName: '故事锋面',
    fansCount: 128432,
    revenueYesterday: 862,
    hideRevenue: false,
    credentialStatus: 'valid',
    lastValidatedAt: '2026-03-31T07:20:00.000Z',
  },
  {
    id: 'bjh-1',
    platform: 'baijiahao',
    displayName: '旧史放映室',
    fansCount: 92018,
    revenueYesterday: 0,
    hideRevenue: true,
    credentialStatus: 'expired',
    lastValidatedAt: '2026-03-31T05:45:00.000Z',
  },
];

export const hotspots = [
  {
    id: 'hotspot-1',
    source: 'toutiao',
    title: '演唱会现场突发争议，舆论开始倒向幕后细节',
    score: '92.4k',
    canGenerate: true,
  },
  {
    id: 'hotspot-2',
    source: 'baidu',
    title: '地方文旅翻红后，游客为什么开始吐槽“只适合拍照”',
    score: '77.8k',
    canGenerate: true,
  },
];

export const skills = [
  {
    id: 'skill-1',
    name: '生成容易引起讨论的头条文章',
    targetPlatforms: ['toutiao'],
    status: 'registered',
  },
  {
    id: 'skill-2',
    name: '热点搜图增强',
    targetPlatforms: ['toutiao', 'baijiahao', 'wechat'],
    status: 'registered',
  },
];

export const drafts = [
  {
    id: 'draft-1',
    title: '文旅爆红后为什么更容易翻车',
    platform: 'baijiahao',
    status: 'preview_pending',
  },
  {
    id: 'draft-2',
    title: '演唱会争议背后真正值得看的不是明星',
    platform: 'toutiao',
    status: 'image_pending',
  },
];

export const systemConfig = {
  aiProvider: 'doubao',
  defaultModel: 'doubao-seed-1-8',
  apiBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: 'sk-demo-value',
  browserPath: '',
  promptDefaults: '默认先预览再发布，优先生成清晰结构、强开头和可搜图的描述。',
  hideRevenueByDefault: false,
  publishRequiresPreview: true,
};
