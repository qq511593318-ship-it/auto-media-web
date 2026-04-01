import { Injectable } from '@nestjs/common';

export type ImageSearchResult = {
  id: string;
  title: string;
  pageUrl: string;
  thumbnailUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  source: string;
  license: string;
};

type WikimediaQueryResponse = {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        fullurl?: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          width?: number;
          height?: number;
          extmetadata?: {
            LicenseShortName?: {
              value?: string;
            };
          };
        }>;
      }
    >;
  };
};

@Injectable()
export class ImagesService {
  async search(query: string, limit = 8): Promise<ImageSearchResult[]> {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('formatversion', '2');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrnamespace', '6');
    url.searchParams.set('gsrsearch', normalizedQuery);
    url.searchParams.set('gsrlimit', String(Math.min(Math.max(limit, 1), 12)));
    url.searchParams.set('prop', 'info|imageinfo');
    url.searchParams.set('inprop', 'url');
    url.searchParams.set('iiprop', 'url|size|extmetadata');
    url.searchParams.set('iiurlwidth', '640');
    url.searchParams.set('origin', '*');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 AutoMedia/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Image search failed: ${response.status}`);
    }

    const data = (await response.json()) as WikimediaQueryResponse;
    const pages = Object.values(data.query?.pages || {});

    return pages
      .map((page) => {
        const image = page.imageinfo?.[0];
        if (!page.pageid || !image?.url || !image.thumburl) {
          return null;
        }

        return {
          id: String(page.pageid),
          title: this.cleanTitle(page.title || ''),
          pageUrl: page.fullurl || image.url,
          thumbnailUrl: image.thumburl,
          imageUrl: image.url,
          width: image.width || 0,
          height: image.height || 0,
          source: 'Wikimedia Commons',
          license: image.extmetadata?.LicenseShortName?.value || 'Unknown',
        } satisfies ImageSearchResult;
      })
      .filter((item): item is ImageSearchResult => Boolean(item));
  }

  private normalizeQuery(query: string) {
    return query
      .replace(/[，。！？、；：“”"'`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  private cleanTitle(title: string) {
    return title.replace(/^File:/i, '').replace(/\.[a-z0-9]{2,5}$/i, '').trim();
  }
}
