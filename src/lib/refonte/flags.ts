// Refonte v26 feature flags (all from Vite env, so the Vercel PREVIEW and PRODUCTION can differ).
//  VITE_REFONTE=on            registers the new screens under /v2/... (preview only until Hedi approves in writing)
//  VITE_SOCIAL_PROOF_MODE     demo = random 2-9 (preview ONLY, to see the rendering) | real (default) = measured, hidden under 2
//  VITE_SMS_ENABLED=true      SMS block (kept hidden until a provider is connected and tested)
export const REFONTE_ON = import.meta.env['VITE_REFONTE'] === 'on';
export const SOCIAL_PROOF_MODE: 'demo' | 'real' = import.meta.env['VITE_SOCIAL_PROOF_MODE'] === 'demo' ? 'demo' : 'real';
export const SMS_ENABLED = import.meta.env['VITE_SMS_ENABLED'] === 'true';
