import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type GenerateDraftInput = {
  hotspotId: string;
  platform?: string;
  accountId?: string;
};

type GeneratedDraftPayload = {
  title: string;
  alternateTitles: string[];
  articleMarkdown: string;
  imagePrompt: string;
  generationPrompt: string;
};

@Injectable()
export class DraftGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generateFromHotspot(input: GenerateDraftInput) {
    const hotspot = await this.prisma.hotspot.findUnique({
      where: { id: input.hotspotId },
    });

    if (!hotspot) {
      throw new Error('热点不存在。');
    }

    const account = await this.resolveAccount(input.accountId, input.platform);
    const platform = input.platform || account?.platform || 'toutiao';
    const config = await this.prisma.systemConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const generationPrompt = this.buildPrompt({
      hotspot,
      platform,
      ownerName: account?.displayName || '',
      promptDefaults: config?.promptDefaults || '',
    });

    const generated =
      (await this.callAiIfConfigured(
        config?.aiProvider || '',
        config?.defaultModel || '',
        config?.apiKey || '',
        config?.apiBaseUrl || '',
        generationPrompt,
      )) ||
      this.buildFallbackDraft(
        hotspot.title,
        hotspot.summary || '',
        platform,
        account?.displayName || '',
      );

    const articleMarkdown = this.ensureMarkdownTitle(
      generated.articleMarkdown,
      generated.title,
    );
    const previewHtml = this.renderMarkdownToHtml(articleMarkdown);
    const promptText = this.composePromptText(generated);

    return this.prisma.draft.create({
      data: {
        title: generated.title,
        content: articleMarkdown,
        platform,
        accountId: account?.id,
        ownerName: account?.displayName || null,
        status: 'preview_pending',
        promptText,
        previewHtml,
      },
    });
  }

  private async resolveAccount(accountId?: string, platform?: string) {
    if (accountId) {
      return this.prisma.platformAccount.findUnique({
        where: { id: accountId },
      });
    }

    if (platform) {
      const preferred =
        (await this.prisma.platformAccount.findFirst({
          where: { platform, isDefault: true },
        })) ||
        (await this.prisma.platformAccount.findFirst({
          where: { platform },
          orderBy: { createdAt: 'asc' },
        }));

      if (preferred) {
        return preferred;
      }
    }

    return this.prisma.platformAccount.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildPrompt(input: {
    hotspot: {
      source: string;
      title: string;
      summary?: string | null;
      score?: string | null;
    };
    platform: string;
    ownerName: string;
    promptDefaults: string;
  }) {
    const platformTone = this.describePlatformTone(input.platform);
    const ownerHint = input.ownerName
      ? `目标账号：${input.ownerName}`
      : '目标账号：默认执行账号';
    const promptDefaults = input.promptDefaults
      ? `附加要求：${input.promptDefaults}`
      : '附加要求：强调开头力度、信息密度和评论区讨论点。';

    return `你是中文自媒体编辑，请根据热点生成一份可直接入库的草稿数据。

请只输出 JSON，不要输出 Markdown 代码块，不要附加解释。JSON 结构如下：
{
  "title": "主标题",
  "alternateTitles": ["备选标题1", "备选标题2", "备选标题3"],
  "articleMarkdown": "# 主标题\\n\\n## 小标题...",
  "imagePrompt": "适合搜图的中文提示词",
  "generationPrompt": "后续可复用的文章生成提示词"
}

输入信息：
- 平台：${input.platform}
- 平台风格：${platformTone}
- ${ownerHint}
- 热点来源：${input.hotspot.source}
- 热点标题：${input.hotspot.title}
- 热点摘要：${input.hotspot.summary || '无'}
- 热度：${input.hotspot.score || '未提供'}
- ${promptDefaults}

生成要求：
- 主标题适合 ${input.platform} 发布，强开头，避免空泛。
- 备选标题给 3 个，风格略有差异，但都要可用。
- 正文使用 Markdown，包含 1 个一级标题和 3 到 4 个二级标题。
- 正文长度 900 到 1400 字，必须是完整文章，不是提纲。
- 文章要解释“为什么这个热点值得讨论”，并给出至少 2 个可延展角度。
- 搜图提示词要具体，适合新闻类或解释类配图检索。
- generationPrompt 要概括这篇文章的写法，方便后续继续改写。`;
  }

  private describePlatformTone(platform: string) {
    if (platform === 'toutiao') {
      return '冲突感更强，开头直接，适合带出争议点和观点。';
    }
    if (platform === 'baijiahao') {
      return '解释型更强，兼顾搜索流量，标题要明确问题导向。';
    }
    if (platform === 'wechat') {
      return '更像编辑部长文，过渡自然，观点完整。';
    }
    return '兼顾传播和解释，语言清晰。';
  }

  private async callAiIfConfigured(
    provider: string,
    model: string,
    apiKey: string,
    apiBaseUrl: string,
    prompt: string,
  ) {
    if (!model.trim() || !apiKey.trim() || apiKey.startsWith('sk-demo')) {
      return null;
    }

    const endpoint = this.resolveChatEndpoint(provider, apiBaseUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildRequestBody(provider, model, prompt)),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string | Array<{ text?: string; type?: string }>;
          };
        }>;
      };
      const content = this.extractMessageContent(data);

      if (!content) {
        return null;
      }

      return this.parseDraftPayload(content);
    } catch (error) {
      console.error('[drafts] ai generation failed:', error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveChatEndpoint(provider: string, apiBaseUrl: string) {
    const normalizedProvider = provider.trim().toLowerCase();
    const normalizedBase = apiBaseUrl.trim().replace(/\/$/, '');

    if (normalizedBase) {
      if (normalizedBase.endsWith('/chat/completions')) {
        return normalizedBase;
      }
      return `${normalizedBase}/chat/completions`;
    }

    if (normalizedProvider === 'doubao') {
      return 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    }

    return 'https://api.openai.com/v1/chat/completions';
  }

  private buildRequestBody(provider: string, model: string, prompt: string) {
    const normalizedProvider = provider.trim().toLowerCase();

    if (normalizedProvider === 'doubao') {
      return {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2600,
        temperature: 0.8,
        thinking: { type: 'disabled' },
      };
    }

    return {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2600,
      temperature: 0.8,
    };
  }

  private extractMessageContent(data: {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string; type?: string }>;
      };
    }>;
  }) {
    const content = data.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      return content.trim();
    }

    if (Array.isArray(content)) {
      return content
        .map((item) => item.text || '')
        .join('\n')
        .trim();
    }

    return '';
  }

  private parseDraftPayload(raw: string): GeneratedDraftPayload | null {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedDraftPayload>;
      const title = String(parsed.title || '').trim();
      const articleMarkdown = String(parsed.articleMarkdown || '').trim();

      if (!title || !articleMarkdown) {
        return null;
      }

      const alternateTitles = Array.isArray(parsed.alternateTitles)
        ? parsed.alternateTitles
            .map((item) => String(item).trim())
            .filter(Boolean)
        : [];

      return {
        title,
        alternateTitles: alternateTitles.slice(0, 3),
        articleMarkdown,
        imagePrompt: String(parsed.imagePrompt || title).trim(),
        generationPrompt: String(parsed.generationPrompt || '').trim(),
      };
    } catch {
      return null;
    }
  }

  private buildFallbackDraft(
    title: string,
    summary: string,
    platform: string,
    ownerName: string,
  ): GeneratedDraftPayload {
    const mainTitle = `${title}，真正值得写的并不只是表面热度`;
    const opening =
      summary ||
      '表面上看是一个快速冲高的话题，真正能沉淀为内容的，往往是情绪背后的结构性原因。';
    const ownerHint = ownerName ? `对于账号“${ownerName}”来说，` : '';

    return {
      title: mainTitle,
      alternateTitles: [
        `${title}之后，为什么讨论点开始转向更深一层`,
        `${title}爆了，但更值得追问的是背后的变化`,
        `${title}这波热度，真正能留下什么内容空间`,
      ],
      imagePrompt: `${title} 新闻现场 事件细节 人群 话题讨论`,
      generationPrompt: `${platform} 平台，围绕热点“${title}”写一篇观点型解释文章，要求强开头、强结构、可延展。`,
      articleMarkdown: `# ${mainTitle}

${opening}

## 先别急着跟着热度跑

很多热点在最初冲上榜单时，看起来像是一场情绪爆发，但真正能转化成内容价值的，不是“大家都在说”，而是“为什么大家会这样说”。${ownerHint}如果只重复事件本身，文章很容易和平台上大量同质信息混在一起；但如果把注意力放到争议出现的原因、传播被放大的路径，以及读者最在意的判断分歧上，内容就会开始有辨识度。

## 这个热点真正的讨论点在哪里

围绕“${title}”继续展开时，至少有两个层面值得写。第一层是表层事实，也就是事件本身给人造成了什么直观感受；第二层则是更深的判断分歧，比如规则是否清晰、预期是否被打破、不同角色的责任边界是否明确。真正能带来评论区讨论的，往往是第二层。因为读者并不只想知道发生了什么，他们更想知道这件事意味着什么，以及类似的情况为什么总会反复出现。

## 为什么这类内容更适合做二次加工

热点内容的窗口期很短，但解释型内容的寿命更长。只要抓住“一个事件背后的普遍逻辑”，文章就不只是追热度，而是在替读者完成一次信息整理。这样的写法也更适合后续继续延展，比如拆成标题版、短评版、长文版，甚至还能配合搜图与封面继续二次分发。比起抢最快，抢“更像编辑部成稿”的完整度，通常更能留下结果。

## 接下来可以怎么继续做

如果要把这条热点继续推进，最直接的方式不是重复新闻摘要，而是往三个方向补足：一是补事实脉络，把时间线讲清楚；二是补角色关系，让读者知道谁在推动、谁在承受、谁在放大；三是补观点张力，给出一个明确判断，再留一个可以引发留言的问题。这样做出来的草稿，既能用于平台发布，也能继续衍生出配图提示词、封面文案和评论区引导句。`,
    };
  }

  private ensureMarkdownTitle(markdown: string, title: string) {
    const normalized = markdown.trim();
    if (normalized.startsWith('# ')) {
      return normalized;
    }
    return `# ${title}\n\n${normalized}`;
  }

  private composePromptText(payload: GeneratedDraftPayload) {
    const titleCandidates = [payload.title, ...payload.alternateTitles]
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n');

    return `标题候选
${titleCandidates}

搜图提示词
${payload.imagePrompt}

生成提示词
${payload.generationPrompt}`;
  }

  private renderMarkdownToHtml(markdown: string) {
    const lines = markdown.replace(/\r/g, '').split('\n');
    const html: string[] = [];
    let paragraph: string[] = [];
    let listItems: string[] = [];

    const flushParagraph = () => {
      if (!paragraph.length) {
        return;
      }
      html.push(`<p>${this.escapeHtml(paragraph.join(' '))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!listItems.length) {
        return;
      }
      html.push(
        `<ul>${listItems
          .map((item) => `<li>${this.escapeHtml(item)}</li>`)
          .join('')}</ul>`,
      );
      listItems = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }

      if (line.startsWith('# ')) {
        flushParagraph();
        flushList();
        html.push(`<h1>${this.escapeHtml(line.slice(2).trim())}</h1>`);
        continue;
      }

      if (line.startsWith('## ')) {
        flushParagraph();
        flushList();
        html.push(`<h2>${this.escapeHtml(line.slice(3).trim())}</h2>`);
        continue;
      }

      if (line.startsWith('### ')) {
        flushParagraph();
        flushList();
        html.push(`<h3>${this.escapeHtml(line.slice(4).trim())}</h3>`);
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        flushParagraph();
        listItems.push(line.slice(2).trim());
        continue;
      }

      if (line.startsWith('![')) {
        flushParagraph();
        flushList();
        html.push(
          `<figure class="preview-figure"><div class="preview-figure-note">${this.escapeHtml(line)}</div></figure>`,
        );
        continue;
      }

      paragraph.push(line);
    }

    flushParagraph();
    flushList();
    return html.join('\n');
  }

  private escapeHtml(input: string) {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
