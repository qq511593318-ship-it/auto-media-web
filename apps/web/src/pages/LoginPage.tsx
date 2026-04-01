import { type FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

export function LoginPage() {
  const { token, signIn } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('change-me-before-production');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.login(username, password);
      signIn(response.token, response.user);
    } catch {
      setError('登录失败，请检查用户名或密码。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-root">
      <section className="login-stage">
        <div className="login-copy">
          <p className="eyebrow">Operator Access</p>
          <h1>把内容生产、热点判断和发布动作，收拢到一个控制界面。</h1>
          <p>
            先登录，再管理账号、验证 Cookie、扫描热点、调用 SKILL、审阅草稿，
            最后再决定是否发布。
          </p>
        </div>

        <div className="signal-board">
          <div>
            <span>03</span>
            <p>已接入平台</p>
          </div>
          <div>
            <span>19</span>
            <p>热点候选</p>
          </div>
          <div>
            <span>08</span>
            <p>待处理草稿</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="panel-kicker">
          <span>单管理员入口</span>
          <strong>后续兼容域名部署认证</strong>
        </div>
        <h2>登录工作台</h2>
        <p className="login-caption">
          第一阶段保持简单认证，不开放注册，只服务于你的个人运营工作流。
        </p>

        {error ? <p className="card-copy">{error}</p> : null}

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field">
            <span>用户名</span>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              type="password"
              placeholder="至少 8 位"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div className="login-actions">
            <button type="submit">{submitting ? '登录中...' : '进入系统'}</button>
            <button type="button" className="button-secondary">
              默认账号：admin
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
