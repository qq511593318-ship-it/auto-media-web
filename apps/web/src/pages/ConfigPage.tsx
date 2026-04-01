import { type FormEvent, useEffect, useState } from 'react';
import { configGroups } from '../data/mock';
import { api } from '../lib/api';
import { buildConfigForm } from '../lib/view-models';

export function ConfigPage() {
  const [form, setForm] = useState(buildConfigForm(null));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await api.getConfig();
        if (!active) return;
        setForm(buildConfigForm(response));
      } catch {
        if (!active) return;
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.updateConfig(form);
      setForm(buildConfigForm(response));
      setMessage('配置已保存到 SQLite。');
    } finally {
      setSaving(false);
    }
  }

  async function validateAll() {
    setSaving(true);
    try {
      await api.validateAllAccounts();
      setMessage('已触发全部账号的 Cookie 校验。');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setMessage('新密码至少 8 位。');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('两次输入的新密码不一致。');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage('密码已更新。');
    } catch {
      setMessage('密码更新失败，请检查当前密码。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel page-section">
      <div className="panel-header">
        <h3>系统配置中心</h3>
        <span>Cookie、AI API、模型参数、浏览器路径</span>
      </div>
      {message ? <p className="card-copy">{message}</p> : null}

      <form className="settings-layout" onSubmit={onSubmit}>
        <section className="settings-form">
          <label className="field">
            <span>AI Provider</span>
            <input
              type="text"
              value={form.aiProvider}
              onChange={(event) => setForm({ ...form, aiProvider: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Model</span>
            <input
              type="text"
              value={form.defaultModel}
              onChange={(event) => setForm({ ...form, defaultModel: event.target.value })}
            />
          </label>
          <label className="field">
            <span>API Base URL</span>
            <input
              type="text"
              placeholder="https://ark.cn-beijing.volces.com/api/v3"
              value={form.apiBaseUrl}
              onChange={(event) => setForm({ ...form, apiBaseUrl: event.target.value })}
            />
          </label>
          <label className="field">
            <span>API Key</span>
            <input
              type="password"
              value={form.apiKey}
              onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Chrome 路径</span>
            <input
              type="text"
              placeholder="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              value={form.browserPath}
              onChange={(event) => setForm({ ...form, browserPath: event.target.value })}
            />
          </label>
          <label className="field field-wide">
            <span>默认提示词</span>
            <textarea
              rows={5}
              value={form.promptDefaults}
              onChange={(event) => setForm({ ...form, promptDefaults: event.target.value })}
            />
          </label>
          <div className="toggle-row">
            <label className="toggle-card">
              <span>发布前必须预览</span>
              <input
                type="checkbox"
                checked={form.publishRequiresPreview}
                onChange={(event) =>
                  setForm({ ...form, publishRequiresPreview: event.target.checked })
                }
              />
            </label>
            <label className="toggle-card">
              <span>默认隐藏收入</span>
              <input
                type="checkbox"
                checked={form.hideRevenueByDefault}
                onChange={(event) =>
                  setForm({ ...form, hideRevenueByDefault: event.target.checked })
                }
              />
            </label>
          </div>
          <div className="button-row">
            <button type="submit">{saving ? '保存中...' : '保存配置'}</button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void validateAll()}
              disabled={saving}
            >
              统一校验 Cookie
            </button>
          </div>
        </section>

        <aside className="settings-aside">
          <form className="config-card form-grid" onSubmit={changePassword}>
            <h4>修改密码</h4>
            <p>开发默认密码应尽快更换，避免后续映射公网时仍沿用初始凭证。</p>
            <label className="field">
              <span>当前密码</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>新密码</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>确认新密码</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                }
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={saving}>
                {saving ? '处理中...' : '更新密码'}
              </button>
            </div>
          </form>

          {configGroups.map((group) => (
            <article key={group.title} className="config-card">
              <h4>{group.title}</h4>
              <p>{group.copy}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </aside>
      </form>
    </section>
  );
}
