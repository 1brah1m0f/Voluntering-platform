import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { LangProvider } from './LangProvider';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './app/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker registration failed', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Analytics />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </LangProvider>
  </StrictMode>,
);
