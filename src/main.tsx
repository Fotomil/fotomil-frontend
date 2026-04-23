import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import * as Sentry from '@sentry/react';
import './i18n';
import './index.css';
import App from './App.tsx';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-xurif6k6cvmaiq7h.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'qN5srsmAHZ0R0FjidNIhuBzzdbC1Bhhm';
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://fotomil.xyz/api';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
        ui_locales: localStorage.getItem('language') || 'sr',
      }}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
