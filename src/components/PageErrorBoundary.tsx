import { Component, type ErrorInfo, type ReactNode } from 'react';

// Local boundary for one page: a crash inside it shows a small recovery card (and the error text, so a screenshot
// is enough to diagnose it) instead of replacing the whole site with the generic "reload" screen.
type Props = { children: ReactNode; onBack?: () => void };
type State = { error: Error | null };

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('PageErrorBoundary', error, info.componentStack); }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-[#B9BBC8] mb-4">Cette étape n’a pas pu s’afficher. Vous pouvez revenir en arrière ou recharger la page.</p>
        <div className="flex justify-center gap-3 mb-6">
          <button type="button" onClick={() => { this.setState({ error: null }); this.props.onBack?.(); }} className="border border-[#17334D] text-white text-sm font-semibold px-4 py-2.5 rounded-lg">Retour</button>
          <button type="button" onClick={() => window.location.reload()} className="bg-orange text-white text-sm font-bold px-4 py-2.5 rounded-lg">Recharger la page</button>
        </div>
        <details className="text-left text-[11px] text-[#8A9BB0]">
          <summary className="cursor-pointer text-center">Détails techniques</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{String(error.message)}{'\n'}{String(error.stack || '').split('\n').slice(1, 4).join('\n')}</pre>
        </details>
      </div>
    );
  }
}
