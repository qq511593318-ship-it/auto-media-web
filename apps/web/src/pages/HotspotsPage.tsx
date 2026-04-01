import { useEffect, useState } from 'react';
import { hotspots } from '../data/mock';
import { api, type ImageSearchResult } from '../lib/api';
import { formatHotspotCard } from '../lib/view-models';

type HotspotCard = ReturnType<typeof formatHotspotCard>;

export function HotspotsPage() {
  const [items, setItems] = useState<HotspotCard[]>(() =>
    hotspots.map((item) => ({
      ...item,
      summary: '',
    })),
  );
  const [sourceFilter, setSourceFilter] = useState<'all' | 'toutiao' | 'baidu' | 'google'>('all');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [activeImagePanelId, setActiveImagePanelId] = useState<string | null>(null);
  const [imageLoadingId, setImageLoadingId] = useState<string | null>(null);
  const [imageResults, setImageResults] = useState<Record<string, ImageSearchResult[]>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await api.getHotspots();
        if (!active) return;
        setItems(response.map(formatHotspotCard));
      } catch {
        if (!active) return;
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function scan(sources: string[]) {
    setScanning(true);
    setMessage('');
    try {
      const response = await api.scanHotspots(sources);
      setItems(response.map(formatHotspotCard));
      setMessage(`已完成 ${sources.join(' / ')} 热点扫描。`);
    } catch {
      setMessage('扫描失败，请稍后重试。');
    } finally {
      setScanning(false);
    }
  }

  async function searchImages(item: HotspotCard) {
    const isOpen = activeImagePanelId === item.id;

    if (isOpen) {
      setActiveImagePanelId(null);
      return;
    }

    setActiveImagePanelId(item.id);

    if (imageResults[item.id]) {
      return;
    }

    setImageLoadingId(item.id);
    setImageErrors((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });

    try {
      const results = await api.searchImages(item.imageQuery, 8);
      setImageResults((current) => ({
        ...current,
        [item.id]: results,
      }));
    } catch {
      setImageErrors((current) => ({
        ...current,
        [item.id]: '搜图失败，请稍后再试。',
      }));
    } finally {
      setImageLoadingId((current) => (current === item.id ? null : current));
    }
  }

  async function generateDraft(item: HotspotCard) {
    setGeneratingId(item.id);
    setMessage('');

    try {
      const draft = await api.generateDraftFromHotspot({
        hotspotId: item.id,
      });
      setMessage(`已生成草稿《${draft.title}》，可前往草稿页预览。`);
    } catch {
      setMessage('草稿生成失败，请先检查 AI 配置或稍后重试。');
    } finally {
      setGeneratingId(null);
    }
  }

  function sourceButtonClass(source: typeof sourceFilter) {
    return sourceFilter === source ? '' : 'button-secondary';
  }

  const filteredItems = items.filter((item) => {
    if (sourceFilter === 'all') return true;
    return item.source.toLowerCase().includes(sourceFilter);
  });

  return (
    <section className="panel page-section">
      <div className="panel-header">
        <h3>热点扫描中心</h3>
        <span>头条 / 百度 / Google / 搜图入口</span>
      </div>
      {message ? <p className="card-copy">{message}</p> : null}
      <div className="filters">
        <button type="button" className={sourceButtonClass('all')} onClick={() => setSourceFilter('all')}>
          全部来源
        </button>
        <button type="button" className="button-secondary">
          过去 24 小时
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => void scan(['toutiao', 'baidu', 'google'])}
          disabled={scanning}
        >
          {scanning ? '扫描中...' : '执行扫描'}
        </button>
      </div>
      <div className="tag-row">
        <button
          type="button"
          className={sourceButtonClass('toutiao')}
          onClick={() => setSourceFilter('toutiao')}
        >
          头条
        </button>
        <button type="button" className={sourceButtonClass('baidu')} onClick={() => setSourceFilter('baidu')}>
          百度
        </button>
        <button type="button" className={sourceButtonClass('google')} onClick={() => setSourceFilter('google')}>
          Google
        </button>
      </div>
      <div className="stack-list">
        {filteredItems.map((item) => (
          <article key={item.id} className="stack-card stack-card-wide">
            <div className="stack-meta">
              <span>{item.source}</span>
              <strong>{item.heat}</strong>
            </div>
            <h4 className="hotspot-headline">{item.title}</h4>
            {item.summary ? <p className="card-copy hotspot-summary">{item.summary}</p> : null}
            <p className="card-copy hotspot-query">搜图提示词：{item.imageQuery}</p>
            <div className="tag-row">
              {item.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="button-row">
              <button
                type="button"
                onClick={() => void generateDraft(item)}
                disabled={generatingId === item.id}
              >
                {generatingId === item.id ? '生成中...' : '生成草稿'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => void searchImages(item)}
                disabled={imageLoadingId === item.id || generatingId === item.id}
              >
                {imageLoadingId === item.id ? '搜图中...' : activeImagePanelId === item.id ? '收起结果' : '一键搜图'}
              </button>
              <button type="button" className="button-secondary">
                加入选题池
              </button>
            </div>
            <p className="card-copy">生成动作默认写入当前默认账号所属平台。</p>
            {activeImagePanelId === item.id ? (
              <section className="image-search-panel">
                <div className="image-search-head">
                  <div>
                    <span className="eyebrow">Visual Search</span>
                    <h5>图片候选</h5>
                  </div>
                  <p className="hotspot-query">
                    查询词：<strong>{item.imageQuery}</strong>
                  </p>
                </div>
                {imageErrors[item.id] ? <p className="card-copy">{imageErrors[item.id]}</p> : null}
                {imageLoadingId === item.id ? (
                  <p className="card-copy">正在从公共图库检索图片候选...</p>
                ) : null}
                {imageLoadingId !== item.id &&
                !imageErrors[item.id] &&
                (imageResults[item.id]?.length || 0) === 0 ? (
                  <p className="card-copy">暂未命中图片，可以调整热点词后再次搜索。</p>
                ) : null}
                {(imageResults[item.id]?.length || 0) > 0 ? (
                  <div className="image-grid">
                    {(imageResults[item.id] || []).map((image) => (
                      <a
                        key={image.id}
                        className="image-card"
                        href={image.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img src={image.thumbnailUrl} alt={image.title} loading="lazy" />
                        <div className="image-card-body">
                          <strong>{image.title}</strong>
                          <span>
                            {image.source} · {image.license}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
