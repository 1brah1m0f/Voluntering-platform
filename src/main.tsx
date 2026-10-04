import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import { LangProvider } from './LangProvider';
import { AuthProvider } from './app/AuthContext';
import AppLayout, { LandingRoute, OldDetailRedirect, RequireAdmin, RequireAuth, RequireStudentAuth, StudentLayout } from './app/AppLayout';
import { Spinner } from './app/ui';

// App pages load on demand so the landing page stays light.
const LoginPage = lazy(() => import('./app/pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./app/pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./app/pages/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./app/pages/AuthPages').then((m) => ({ default: m.ResetPasswordPage })));
const OpportunitiesPage = lazy(() => import('./app/pages/OpportunitiesPage'));
const HomePage = lazy(() => import('./app/pages/HomePage'));
const DetailPage = lazy(() => import('./app/pages/DetailPage'));
const TrackerPage = lazy(() => import('./app/pages/TrackerPage'));
const AiPage = lazy(() => import('./app/pages/AiPage'));
const CvPage = lazy(() => import('./app/pages/CvPage'));
const CalendarPage = lazy(() => import('./app/pages/CalendarPage'));
const MapPage = lazy(() => import('./app/pages/MapPage'));
const StudentPage = lazy(() => import('./app/pages/StudentPage'));
const StudentProfilePage = lazy(() => import('./app/student/StudentProfile'));
const GuidesPage = lazy(() => import('./app/pages/LearnPages').then((m) => ({ default: m.GuidesPage })));
const GuidePage = lazy(() => import('./app/pages/LearnPages').then((m) => ({ default: m.GuidePage })));
const ProgramPage = lazy(() => import('./app/pages/LearnPages').then((m) => ({ default: m.ProgramPage })));
const ProfilePage = lazy(() => import('./app/pages/ProfilePage'));
const AdminListPage = lazy(() => import('./app/pages/AdminPages').then((m) => ({ default: m.AdminListPage })));
const AdminUsersPage = lazy(() => import('./app/pages/AdminUsersPage'));
const AdminEditPage = lazy(() => import('./app/pages/AdminPages').then((m) => ({ default: m.AdminEditPage })));
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route
                path="/"
                element={
                  <LandingRoute>
                    <App />
                  </LandingRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {/* Student accounts sign in on the same pages, with the Student tab picked. */}
              <Route path="/student/login" element={<Navigate to="/login?as=student" replace />} />
              <Route path="/student/register" element={<Navigate to="/register?as=student" replace />} />
              {/* The student section: its own shell, only for student accounts (and admins). */}
              <Route element={<RequireStudentAuth />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student" element={<StudentPage />} />
                  <Route path="/student/profile" element={<StudentProfilePage />} />
                </Route>
              </Route>
              {/* The opportunity list and pages are public (shareable, indexable);
                  saving, tracking, the AI tools and the account need an account.
                  Student accounts are sent to /student. */}
              <Route element={<AppLayout />}>
                <Route path="/app" element={<OpportunitiesPage />} />
                <Route path="/o/:id" element={<DetailPage />} />
                <Route path="/app/calendar" element={<CalendarPage />} />
                <Route path="/app/map" element={<MapPage />} />
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="/guides/:slug" element={<GuidePage />} />
                <Route path="/programs/:slug" element={<ProgramPage />} />
                <Route element={<RequireAuth />}>
                  <Route path="/app/home" element={<HomePage />} />
                  <Route path="/app/tracker" element={<TrackerPage />} />
                  <Route path="/app/ai" element={<AiPage />} />
                  <Route path="/app/cv" element={<CvPage />} />
                  <Route path="/app/profile" element={<ProfilePage />} />
                  <Route path="/app/welcome" element={<ProfilePage onboarding />} />
                  <Route path="/app/premium" element={<Navigate to="/app/profile?tab=premium" replace />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/admin" element={<AdminListPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/new" element={<AdminEditPage />} />
                    <Route path="/admin/:id" element={<AdminEditPage />} />
                  </Route>
                </Route>
              </Route>
              {/* Old links (emails sent before the move). */}
              <Route path="/app/o/:id" element={<OldDetailRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
);
