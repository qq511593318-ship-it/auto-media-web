import { useEffect, useState } from 'react';
import { skills } from '../data/mock';
import { api } from '../lib/api';
import { formatSkillCard } from '../lib/view-models';

export function SkillsPage() {
  const [items, setItems] = useState(skills);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await api.getSkills();
        if (!active) return;
        setItems(response.map(formatSkillCard));
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
    <section className="panel page-section">
      <div className="panel-header">
        <h3>SKILL 中心</h3>
        <span>本地技能目录 + 平台账号调用入口</span>
      </div>
      <div className="stack-list">
        {items.map((skill) => (
          <article key={skill.id} className="stack-card stack-card-wide">
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
            <div className="button-row">
              <button type="button">选择账号执行</button>
              <button type="button" className="button-secondary">
                查看参数
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
