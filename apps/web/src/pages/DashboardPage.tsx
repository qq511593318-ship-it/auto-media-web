import { useEffect, useState } from 'react';
import { accountCards, draftQueue, hotspots, skills } from '../data/mock';
import { api } from '../lib/api';
import { formatAccountCard, formatDraftCard, formatHotspotCard, formatSkillCard } from '../lib/view-models';

export function DashboardPage() {
  const [cards, setCards] = useState(accountCards);
  const [trendItems, setTrendItems] = useState(hotspots);
  const [skillItems, setSkillItems] = useState(skills);
  const [draftItems, setDraftItems] = useState(draftQueue);
  const [counts, setCounts] = useState({
    accounts: accountCards.length,
    hotspots: hotspots.length,
    drafts: draftQueue.length,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [overview, accountsData, hotspotsData, skillsData, draftsData] = await Promise.all([
          api.getOverview(),
          api.getAccounts(),
          api.getHotspots(),
          api.getSkills(),
          api.getDrafts(),
        ]);

        if (!active) return;

        setCards(accountsData.map(formatAccountCard));
        setTrendItems(hotspotsData.map(formatHotspotCard));
        setSkillItems(skillsData.map(formatSkillCard));
        setDraftItems(draftsData.map(formatDraftCard));
        setCounts({
          accounts: overview.counts?.accounts ?? accountsData.length,
          hotspots: overview.counts?.hotspots ?? hotspotsData.length,
          drafts: overview.counts?.drafts ?? draftsData.length,
        });
      } catch {
        if (!active) return;
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Design Direction</p>
          <h3>像内容编辑部一样调度，而不是像传统后台一样堆表格。</h3>
        </div>
        <p className="hero-copy">
          这版界面把账号状态、热点压力、技能入口、搜图动作和草稿节奏收拢到一个视图里。
          后续接入真实 API 后，首页就能直接作为运营面板使用。
        </p>
        <div className="hero-metrics">
          <div>
            <span>{String(counts.accounts).padStart(2, '0')}</span>
            <p>已连接平台</p>
          </div>
          <div>
            <span>{String(counts.hotspots).padStart(2, '0')}</span>
            <p>今日热点候选</p>
          </div>
          <div>
            <span>{String(counts.drafts).padStart(2, '0')}</span>
            <p>待处理草稿</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>账号卡片预览</h3>
          <span>多平台 / 多账号 / 状态校验</span>
        </div>
        <div className="card-grid">
          {cards.map((card) => (
            <article key={card.id} className="account-card">
              <div className="account-topline">
                <span>{card.platform}</span>
                <span className={`tone tone-${card.statusTone}`}>{card.status}</span>
              </div>
              <h4>{card.handle}</h4>
              <p className="card-copy">{card.summary}</p>
              <dl className="meta-pairs">
                <div>
                  <dt>粉丝数</dt>
                  <dd>{card.fans}</dd>
                </div>
                <div>
                  <dt>昨日收入</dt>
                  <dd>{card.revenue}</dd>
                </div>
                <div>
                  <dt>最后验证</dt>
                  <dd>{card.lastSync}</dd>
                </div>
                <div>
                  <dt>当前模式</dt>
                  <dd>{card.publishState}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>热点候选</h3>
          <span>聚合源 + 一键搜图</span>
        </div>
        <div className="stack-list">
          {trendItems.map((item) => (
            <article key={item.id} className="stack-card">
              <div className="stack-meta">
                <span>{item.source}</span>
                <strong>{item.heat}</strong>
              </div>
              <h4>{item.title}</h4>
              <p className="card-copy">{item.angle}</p>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>SKILL 入口</h3>
          <span>按平台和账号触发</span>
        </div>
        <div className="stack-list">
          {skillItems.map((skill) => (
            <article key={skill.id} className="stack-card">
              <div className="stack-meta">
                <span>{skill.platform}</span>
                <strong>{skill.lastRun}</strong>
              </div>
              <h4>{skill.name}</h4>
              <p>{skill.summary}</p>
              <div className="tag-row">
                {skill.inputs.map((input) => (
                  <span key={input} className="tag">
                    {input}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>草稿节奏</h3>
          <span>预览优先，不直接发布</span>
        </div>
        <div className="draft-list">
          {draftItems.map((draft) => (
            <article key={draft.id} className="draft-row">
              <div>
                <h4>{draft.title}</h4>
                <p>
                  {draft.platform} · {draft.owner}
                </p>
              </div>
              <span className="draft-state">{draft.state}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
