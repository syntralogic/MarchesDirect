import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
  environment: import.meta.env.MODE,
});

function ErrorFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '12px',
      background: '#001326', color: 'white', textAlign: 'center', padding: '24px',
    }}>
      <p style={{ fontSize: '14px', color: '#B9BBC8' }}>
        Une erreur inattendue est survenue. Merci de recharger la page.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#FF6B00', color: 'white', border: 'none', borderRadius: '8px',
          padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Recharger la page
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <AppWrapper>
      <App />
    </AppWrapper>
  </Sentry.ErrorBoundary>
);
