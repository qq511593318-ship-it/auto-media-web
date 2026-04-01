import { useEffect, useState } from 'react';
import { accountCards } from '../data/mock';
import { api, type AccountRecord } from '../lib/api';
import { formatAccountCard } from '../lib/view-models';

export function AccountsPage() {
  const [cards, setCards] = useState(accountCards);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await api.getAccounts();
        if (!active) return;
        syncAccounts(response);
      } catch {
        if (!active) return;
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  function syncAccounts(response: AccountRecord[]) {
    setCards(response.map(formatAccountCard));
    setCredentials((current) => {
      const next = { ...current };
      for (const account of response) {
        next[account.id] = current[account.id] ?? account.credentialBlob ?? '';
      }
      return next;
    });
  }

  async function saveCredential(id: string) {
    setBusyId(id);
    try {
      await api.updateAccountCredential(id, credentials[id] || '');
      const response = await api.getAccounts();
      syncAccounts(response);
    } finally {
      setBusyId(null);
    }
  }

  async function validateAccount(id: string) {
    setBusyId(id);
    try {
      await api.updateAccountCredential(id, credentials[id] || '');
      await api.validateAccount(id);
      const response = await api.getAccounts();
      syncAccounts(response);
    } finally {
      setBusyId(null);
    }
  }

  async function setDefault(id: string) {
    setBusyId(id);
    try {
      const response = await api.setDefaultAccount(id);
      syncAccounts(response);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel page-section">
      <div className="panel-header">
        <h3>平台账号中心</h3>
        <span>Cookie 校验 / 多账号切换 / 收入隐藏</span>
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
                <dt>平台</dt>
                <dd>{card.platform}</dd>
              </div>
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
            </dl>
            <div className="button-row">
              <button type="button" onClick={() => void saveCredential(card.id)} disabled={busyId === card.id}>
                {busyId === card.id ? '处理中...' : '保存 Cookie'}
              </button>
              <button type="button" onClick={() => void validateAccount(card.id)} disabled={busyId === card.id}>
                {busyId === card.id ? '处理中...' : '验证 Cookie'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => void setDefault(card.id)}
                disabled={busyId === card.id}
              >
                设为默认
              </button>
            </div>
            <label className="field field-wide">
              <span>Cookie</span>
              <textarea
                rows={4}
                placeholder="在这里粘贴当前平台账号的 Cookie"
                value={credentials[card.id] || ''}
                onChange={(event) =>
                  setCredentials((current) => ({
                    ...current,
                    [card.id]: event.target.value,
                  }))
                }
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
