import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import { LangProvider } from './LangProvider';
import { AuthProvider } from './app/AuthContext';
import AppLayout, { RequireAdmin, RequireAuth } from './app/AppLayout';
import { Spinner } from './app/ui';

// App pages load on demand so the landing page stays light.
const LoginPage = lazy(() => import('./app/pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./app/pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const OpportunitiesPage = lazy(() => import('./app/pages/OpportunitiesPage'));
const DetailPage = lazy(() => import('./app/pages/DetailPage'));
const TrackerPage = lazy(() => import('./app/pages/TrackerPage'));
const ProfilePage = lazy(() => import('./app/pages/ProfilePage'));
const AdminListPage = lazy(() => import('./app/pages/AdminPages').then((m) => ({ default: m.AdminListPage })));
const AdminEditPage = lazy(() => import('./app/pages/AdminPages').then((m) => ({ default: m.AdminEditPage })));
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/app" element={<OpportunitiesPage />} />
                  <Route path="/app/o/:id" element={<DetailPage />} />
                  <Route path="/app/tracker" element={<TrackerPage />} />
                  <Route path="/app/profile" element={<ProfilePage />} />
                  <Route path="/app/welcome" element={<ProfilePage onboarding />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/admin" element={<AdminListPage />} />
                    <Route path="/admin/new" element={<AdminEditPage />} />
                    <Route path="/admin/:id" element={<AdminEditPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
);
