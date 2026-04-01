import { createBrowserRouter } from 'react-router-dom';
import { AccountsPage } from './pages/AccountsPage';
import { ConfigPage } from './pages/ConfigPage';
import { DashboardPage } from './pages/DashboardPage';
import { DraftsPage } from './pages/DraftsPage';
import { HotspotsPage } from './pages/HotspotsPage';
import { LoginPage } from './pages/LoginPage';
import { SkillsPage } from './pages/SkillsPage';
import { ProtectedShell } from './shell/ProtectedShell';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'hotspots', element: <HotspotsPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'drafts', element: <DraftsPage /> },
      { path: 'config', element: <ConfigPage /> },
    ],
  },
]);
