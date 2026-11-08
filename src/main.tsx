import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import "./index.css";
import { initPwa } from "./lib/pwa";

initPwa();

Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
  environment: import.meta.env.MODE,
});

// 8 nov. : chaque plantage est envoyé au serveur (message, pile, page sans paramètres, aucune donnée personnelle) pour
// être corrigé, et une courte référence s'affiche (utile si le visiteur fait une capture d'écran).
const API = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';
const reported = new Set<string>();
function report(error: unknown, componentStack?: string | null) {
  try {
    const e = error instanceof Error ? error : new Error(String(error));
    const key = `${e.message}|${location.pathname}`; if (reported.has(key)) return; reported.add(key);
    fetch(`${API}/client-errors`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, message: e.message, stack: e.stack || null, componentStack: componentStack || null,
        build: (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined)?.slice(0, 12) || null }) }).catch(() => {});
  } catch { /* jamais bloquant */ }
}

function ErrorFallback({ error, componentStack }: { error?: unknown; componentStack?: string | null }) {
  if (error) report(error, componentStack);
  const ref = error instanceof Error ? error.message.slice(0, 80) : '';
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '12px',
      background: '#001326', color: 'white', textAlign: 'center', padding: '24px',
    }}>
      <p style={{ fontSize: '14px', color: '#B9BBC8' }}>
        Une erreur inattendue est survenue. Merci de recharger la page.
      </p>
      {ref && <p style={{ fontSize: '11px', color: '#5F6B7D', maxWidth: '320px', wordBreak: 'break-word' }}>Réf. : {ref}</p>}
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

// Browser auto-translate (Google Translate) wraps/replaces text nodes behind React's back, which makes React throw
// "removeChild ... not a child of this node" and blank the page. Tolerate that instead of crashing.
if (typeof Node === 'function' && Node.prototype) {
  const origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return origRemoveChild.call(this, child) as T;
  };
  const origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return newNode;
    return origInsertBefore.call(this, newNode, ref) as T;
  };
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={({ error, componentStack }) => <ErrorFallback error={error} componentStack={componentStack} />}>
    <AppWrapper>
      <App />
    </AppWrapper>
  </Sentry.ErrorBoundary>
);
