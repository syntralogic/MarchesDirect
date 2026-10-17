import { useEffect, useState } from 'react';
import { AdvisorInsight } from '@/components/AdvisorInsight';
import { advisorApi } from '@/lib/apiClient';

// AdvisorInsight whose text is written by the AI from server-side facts (client brief: enthusiastic, 3 short
// sentences, one concrete aid, one next action). The deterministic `fallbackAdvice` is shown immediately and
// stays if the AI does not answer, so the frame is never empty and never blocks the journey.
// - the text only ever applies to the exact inputs it was generated for: when an answer changes, the previous
//   AI text is dropped at once (never "oui" wording next to a "non"), the old request is aborted, and a new one starts;
// - same inputs => the server returns the same cached text, so coming back without changes shows the same advice.

interface Props {
  id?: string;
  kind: 'opportunity' | 'compatibility';
  opportunityId?: string;
  sessionId?: string;
  answers?: Record<string, 'oui' | 'non' | 'a_confirmer' | undefined>;
  fallbackAdvice: string;
  ctaLabel: string;
  onNext: () => void;
  className?: string;
}

const DEBOUNCE_MS = 400;

export function AiAdvisorInsight({ id, kind, opportunityId, sessionId, answers, fallbackAdvice, ctaLabel, onNext, className }: Props) {
  const answersKey = kind === 'compatibility'
    ? ['experience', 'capacity', 'location', 'calendar'].map(k => `${k}:${answers?.[k] || ''}`).join(',')
    : '';
  const requestKey = `${kind}|${opportunityId || ''}|${answersKey}`;
  const [generated, setGenerated] = useState<{ key: string; text: string } | null>(null);

  useEffect(() => {
    if (!opportunityId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      advisorApi
        .advice({ kind, opportunityId, sessionId, answers: kind === 'compatibility' ? answers : undefined }, controller.signal)
        .then(text => { if (!controller.signal.aborted && text) setGenerated({ key: requestKey, text }); });
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
    // requestKey already covers kind/opportunityId/answers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, sessionId]);

  const advice = generated && generated.key === requestKey ? generated.text : fallbackAdvice;
  return <AdvisorInsight id={id} advice={advice} ctaLabel={ctaLabel} onNext={onNext} className={className} />;
}
