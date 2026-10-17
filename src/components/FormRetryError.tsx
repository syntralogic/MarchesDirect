interface FormRetryErrorProps {
  message: string;
  onRetry: () => void;
  busy?: boolean;
  className?: string;
}

/** Failure state of a form: understandable message + "Réessayer". Fields are never cleared. */
export function FormRetryError({ message, onRetry, busy, className = '' }: FormRetryErrorProps) {
  return (
    <div role="alert" className={`rounded-xl border border-red-500/30 bg-red-500/10 p-3 ${className}`}>
      <p className="text-sm text-red-300 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="mt-2 min-h-[44px] px-4 rounded-lg border border-red-400/50 text-sm font-bold text-white hover:bg-red-500/20 disabled:opacity-60"
      >
        Réessayer
      </button>
    </div>
  );
}
