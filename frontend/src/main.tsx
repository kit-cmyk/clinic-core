import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import router from './router/index';

const PHI_FIELDS = ['password', 'phone', 'dob', 'allergies', 'bloodType', 'refresh_token', 'access_token'];

function scrubPhi(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  for (const key of Object.keys(out)) {
    out[key] = PHI_FIELDS.includes(key) ? '[redacted]' : scrubPhi(out[key]);
  }
  return out;
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.request?.data) event.request.data = scrubPhi(event.request.data) as typeof event.request.data;
      return event;
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
