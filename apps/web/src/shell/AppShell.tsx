import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const navItems = [
  { to: '/', label: '总览' },
  { to: '/accounts', label: '账号' },
  { to: '/hotspots', label: '热点' },
  { to: '/skills', label: 'SKILL' },
  { to: '/drafts', label: '草稿' },
  { to: '/config', label: '配置' },
];

export function AppShell() {
  const { signOut, user } = useAuth();

  return (
    <div className="studio-root">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Auto Media Studio</p>
          <h1>运营控制台</h1>
          <p className="brand-copy">
            账号、热点、搜图、技能、草稿与发布，不再散落在脚本和平台后台之间。
          </p>
        </div>

        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' nav-item-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <span>部署提醒</span>
          <strong>Web 端口固定为 8080</strong>
          <p>当前设计为本地优先，也兼容你将 8080 反向代理到公网。</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Editorial Ops</p>
            <h2>从热点扫描到最终发布的统一工作流</h2>
          </div>
          <div className="status-strip">
            <span className="status-pill">{user?.username || 'admin'}</span>
            <span className="status-pill status-pill-live">认证已规划</span>
            <span className="status-pill">MCP 已预留</span>
            <span className="status-pill">多账号切换待接入</span>
            <button type="button" className="button-secondary" onClick={signOut}>
              退出
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
