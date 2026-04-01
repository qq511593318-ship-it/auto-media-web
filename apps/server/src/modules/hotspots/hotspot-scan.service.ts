import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

type ScanItem = {
  source: string;
  title: string;
  summary?: string;
  score?: string;
  rawUrl?: string;
  canGenerate: boolean;
};

@Injectable()
export class HotspotScanService {
  private readonly googleEditions = [
    {
      region: 'US',
      url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    },
    {
      region: 'GB',
      url: 'https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en',
    },
    {
      region: 'IN',
      url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    },
    {
      region: 'AU',
      url: 'https://news.google.com/rss?hl=en-AU&gl=AU&ceid=AU:en',
    },
  ];

  private makeId(source: string, title: string) {
    return createHash('sha1').update(`${source}:${title}`).digest('hex').slice(0, 24);
  }

  async scanSources(sources: string[]) {
    const tasks = sources.map(async (source) => {
      try {
        if (source === 'toutiao') return await this.fetchToutiao();
        if (source === 'baidu') return await this.fetchBaidu();
        if (source === 'google') return await this.fetchGoogleNews();
        return [];
      } catch (error) {
        console.error(`[hotspots] scan failed for ${source}:`, error);
        return [];
      }
    });

    const groups = await Promise.all(tasks);
    return groups.flat().map((item: ScanItem) => ({
      id: this.makeId(item.source, item.title),
      ...item,
    }));
  }

  private async fetchToutiao(): Promise<ScanItem[]> {
    const response = await fetch(
      'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      },
    );
    const data = (await response.json()) as {
      data?: Array<Record<string, unknown>>;
    };

    const items = Array.isArray(data?.data) ? data.data : [];
    return items.slice(0, 15).map((item: Record<string, unknown>) => ({
      source: 'toutiao',
      title: String(item.Title || item.title || ''),
      summary: String(item.Label || item.label || ''),
      score: String(item.HotValue || item.hot || item.score || ''),
      rawUrl: String(item.Url || item.url || ''),
      canGenerate: true,
    })).filter((item: ScanItem) => item.title);
  }

  private async fetchBaidu(): Promise<ScanItem[]> {
    const response = await fetch('https://top.baidu.com/board?tab=realtime', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const html = await response.text();

    const match = String(html).match(/<!--s-data:(\{[\s\S]*?\})-->/);
    if (!match) {
      return [];
    }

    const state = JSON.parse(match[1]) as {
      data?: {
        cards?: Array<{
          component?: string;
          content?: Array<Record<string, unknown>>;
        }>;
      };
    };

    const hotCard =
      state.data?.cards?.find((card) => card.component === 'hotList') || null;
    const items = hotCard?.content || [];
    return items
      .slice(0, 15)
      .map((item: Record<string, unknown>) => ({
        source: 'baidu',
        title: String(item.word || item.query || ''),
        summary: String(item.desc || ''),
        score: String(item.hotScore || item.hotTag || ''),
        rawUrl: String(item.rawUrl || item.url || ''),
        canGenerate: true,
      }))
      .filter((item: ScanItem) => item.title);
  }

  private async fetchGoogleNews(): Promise<ScanItem[]> {
    const groups = await Promise.all(
      this.googleEditions.map(async (edition) => {
        const response = await fetch(edition.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
        const text = await response.text();
        return this.parseGoogleFeed(text, edition.region);
      }),
    );

    const seen = new Set<string>();
    const merged: ScanItem[] = [];

    for (const group of groups) {
      for (const item of group) {
        const key = item.title.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        merged.push(item);
      }
    }

    return merged.slice(0, 15);
  }

  private parseGoogleFeed(xml: string, region: string): ScanItem[] {
    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    return itemMatches
      .slice(0, 8)
      .map((match): ScanItem | null => {
        const block = match[1];
        const title = this.normalizeGoogleTitle(this.extractXmlTag(block, 'title'));
        const link = this.extractXmlTag(block, 'link');
        const description = this.extractXmlTag(block, 'description');
        const summary = this.extractGoogleSummary(description);

        if (!title) {
          return null;
        }

        return {
          source: 'google',
          title,
          summary,
          score: `global · ${region}`,
          rawUrl: link,
          canGenerate: true,
        };
      })
      .filter((item): item is ScanItem => Boolean(item));
  }

  private extractXmlTag(block: string, tag: string) {
    const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return match ? match[1].trim() : '';
  }

  private normalizeGoogleTitle(title: string) {
    return this.decodeHtmlEntities(title)
      .replace(/^<!\[CDATA\[/, '')
      .replace(/\]\]>$/, '')
      .replace(/\s+-\s+[^-]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractGoogleSummary(description: string) {
    const decoded = this.decodeHtmlEntities(description)
      .replace(/^<!\[CDATA\[/, '')
      .replace(/\]\]>$/, '')
      .trim();

    const linkedTitles = [...decoded.matchAll(/<a\b[^>]*>(.*?)<\/a>/gi)]
      .map((match) => this.stripHtml(match[1]))
      .map((item) => item.trim())
      .filter(Boolean);

    if (linkedTitles.length) {
      return linkedTitles.slice(0, 3).join(' / ');
    }

    return this.stripHtml(decoded)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
  }

  private stripHtml(input: string) {
    return input
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeHtmlEntities(input: string) {
    return input
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}
