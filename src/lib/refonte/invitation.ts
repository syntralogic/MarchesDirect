// Spec 3.12 - "30 minutes offertes" invitation rules (a bottom sheet, not a pop-up).
// Once per visit; never after a choice or an appointment request; postponed by 15 s while a field is active.
export const INVITE_KEY = 'md_invite30_shown';
export const INVITE_DELAY_MS = 40_000;
export const INVITE_POSTPONE_MS = 15_000;

export type InviteDecision = 'show' | 'postpone' | 'never';

export function decideInvitation(s: { alreadyShown: boolean; acted: boolean; fieldActive: boolean }): InviteDecision {
  if (s.alreadyShown || s.acted) return 'never';
  if (s.fieldActive) return 'postpone';
  return 'show';
}

export const wasInviteShown = (): boolean => { try { return sessionStorage.getItem(INVITE_KEY) === '1'; } catch { return false; } };
export const markInviteShown = (): void => { try { sessionStorage.setItem(INVITE_KEY, '1'); } catch { /* private mode: worst case it can show once more */ } };
