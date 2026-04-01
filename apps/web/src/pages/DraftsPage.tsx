import { useEffect, useState } from 'react';
import { draftQueue } from '../data/mock';
import { api, type DraftRecord } from '../lib/api';
import { formatDraftCard } from '../lib/view-models';

export function DraftsPage() {
  const [items, setItems] = useState(draftQueue);
  const [activeId, setActiveId] = useState<string | null>(draftQueue[0]?.id || null);
  const [detail, setDetail] = useState<DraftRecord | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await api.getDrafts();
        if (!active) return;
        setItems(response.map(formatDraftCard));
        setActiveId((current) =>
          current && response.some((draft) => draft.id === current)
            ? current
            : response[0]?.id || null,
        );
      } catch {
        if (!active) return;
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDetail(id: string) {
      setLoadingId(id);
      try {
        const response = await api.getDraft(id);
        if (!active) return;
        setDetail(response);
      } catch {
        if (!active) return;
        setDetail(null);
      } finally {
        if (!active) return;
        setLoadingId((current) => (current === id ? null : current));
      }
    }

    if (activeId) {
      void loadDetail(activeId);
    }

    return () => {
      active = false;
    };
  }, [activeId]);

  return (
    <section className="panel page-section">
      <div className="panel-header">
        <h3>草稿与预览</h3>
        <span>编辑、预览、审核、发布前确认</span>
      </div>
      <div className="drafts-layout">
        <div className="draft-list-stack">
          {items.map((draft) => (
            <article
              key={draft.id}
              className={`draft-card-shell${activeId === draft.id ? ' draft-card-shell-active' : ''}`}
            >
              <div>
                <h4>{draft.title}</h4>
                <p>
                  {draft.platform} · {draft.owner}
                </p>
              </div>
              <div className="button-row">
                <span className="draft-state">{draft.state}</span>
                <button
                  type="button"
                  className={activeId === draft.id ? '' : 'button-secondary'}
                  onClick={() => setActiveId(draft.id)}
                >
                  {activeId === draft.id ? '当前预览' : '打开预览'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <article className="preview-panel">
          {loadingId ? <p className="card-copy">正在加载草稿预览...</p> : null}
          {!loadingId && detail ? (
            <>
              <div className="panel-header">
                <div>
                  <h3>{detail.title}</h3>
                  <span>
                    {detail.platform} · {detail.ownerName || '未分配账号'} · {detail.status}
                  </span>
                </div>
              </div>
              {detail.previewHtml ? (
                <div
                  className="preview-body"
                  dangerouslySetInnerHTML={{
                    __html: detail.previewHtml,
                  }}
                />
              ) : (
                <div className="preview-body">
                  <pre>{detail.content}</pre>
                </div>
              )}
              {detail.promptText ? (
                <section className="prompt-sheet">
                  <h4>生成记录</h4>
                  <pre>{detail.promptText}</pre>
                </section>
              ) : null}
            </>
          ) : null}
          {!loadingId && !detail ? (
            <div className="empty-state">
              <h4>还没有可预览的草稿</h4>
              <p>从热点页生成一篇草稿后，这里会展示完整预览和生成记录。</p>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
