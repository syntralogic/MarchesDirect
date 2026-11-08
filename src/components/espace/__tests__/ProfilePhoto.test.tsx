import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import ProfilePhoto, { ProfilePhotoCompact } from '@/components/espace/ProfilePhoto';
import ProfileAvatar from '@/components/ProfileAvatar';
import { saveLocalAvatar } from '@/lib/localAvatar';

const state = vi.hoisted(() => ({
  authenticated: false, avatarUrl: null as string | null,
  upload: vi.fn(), refresh: vi.fn(), prepare: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({
  isAuthenticated: state.authenticated, loading: false,
  user: state.authenticated ? { avatarUrl: state.avatarUrl } : null,
  refreshProfile: state.refresh,
}) }));
vi.mock('@/lib/apiClient', () => ({ uploadsApi: { uploadAvatar: state.upload } }));
vi.mock('@/lib/prepareAvatar', () => ({ prepareAvatar: state.prepare }));
const PHOTO = 'data:image/jpeg;base64,cGhvdG8=';
const OTHER = 'data:image/jpeg;base64,b3RoZXI=';
let host: HTMLDivElement, root: Root;
async function render() { await act(async () => { root.render(<><ProfileAvatar /><ProfilePhoto /></>); }); }
async function choose() {
  const input = host.querySelector('input')!;
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['image'], 'phone.jpg', { type: 'image/jpeg' })] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); state.authenticated = false; state.avatarUrl = null;
  state.upload.mockReset(); state.refresh.mockReset(); state.prepare.mockReset();
  state.prepare.mockResolvedValue({ file: new File(['jpeg'], 'photo-profil.jpg', { type: 'image/jpeg' }), dataUrl: PHOTO });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
describe('photo accessible from Mon espace', () => {
  it('renders the compact dashboard photo and keeps local upload available', async () => {
    await act(async () => root.render(<ProfilePhotoCompact />));
    expect(host.querySelector('button')?.getAttribute('aria-label')).toBe('Ajouter ma photo');
    await choose();
    expect(host.querySelector('img')?.src).toBe(PHOTO);
    expect(host.querySelector('button')?.getAttribute('aria-label')).toBe('Modifier ma photo');
    expect(state.upload).not.toHaveBeenCalled();
  });
  it('saves without an account or server upload and updates every displayed avatar', async () => {
    await render(); expect(host.textContent).toContain('Ajouter ma photo');
    await choose(); expect(state.upload).not.toHaveBeenCalled();
    expect(host.querySelectorAll('img')).toHaveLength(2);
    expect([...host.querySelectorAll('img')].every(x => x.src === PHOTO)).toBe(true);
    expect(host.textContent).toContain('Photo enregistrée sur cet appareil.');
    await act(async () => root.unmount()); root = createRoot(host); await render();
    expect(host.querySelector('img')?.src).toBe(PHOTO); expect(host.textContent).toContain('Modifier ma photo');
  });
  it('opens the native image selector from the visible button', async () => {
    await render(); const input = host.querySelector('input')!; const click = vi.spyOn(input, 'click');
    await act(async () => host.querySelector('button')!.click()); expect(click).toHaveBeenCalledOnce();
  });
  it('does not replace an existing photo or report success when local storage is full', async () => {
    saveLocalAvatar(OTHER); await render();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    await choose(); expect(host.querySelector('[role="alert"]')?.textContent).toContain('n’a pas pu être conservée');
    expect(host.querySelector('img')?.src).toBe(OTHER); expect(host.querySelector('[role="status"]')).toBeNull();
  });
  it('removes the phone photo from all displays and subsequent visits', async () => {
    saveLocalAvatar(PHOTO); await render();
    const remove = [...host.querySelectorAll('button')].find(b => b.textContent?.startsWith('Retirer'))!;
    await act(async () => remove.click()); expect(host.querySelector('img')).toBeNull();
    await act(async () => root.unmount()); root = createRoot(host); await render(); expect(host.querySelector('img')).toBeNull();
  });
  it('uses account storage when signed in and never substitutes the anonymous photo', async () => {
    saveLocalAvatar(PHOTO); state.authenticated = true; await render();
    expect(host.querySelector('img')).toBeNull();
    state.upload.mockResolvedValue({ avatarUrl: 'https://api.example/avatar?v=2' });
    state.refresh.mockImplementation(async () => { state.avatarUrl = 'https://api.example/avatar?v=2'; });
    await choose(); expect(state.upload).toHaveBeenCalledOnce(); expect(state.refresh).toHaveBeenCalledOnce();
    expect(host.querySelector('img')?.src).toBe('https://api.example/avatar?v=2');
    expect(host.textContent).toContain('Photo enregistrée sur votre compte.');
    expect(host.textContent).not.toContain('Retirer ma photo de cet appareil');
  });
  it('shows an upload failure without pretending the account was updated', async () => {
    state.authenticated = true; state.upload.mockRejectedValue(new Error('Impossible de joindre le serveur.'));
    await render(); await choose(); expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.querySelector('[role="status"]')).toBeNull(); expect(state.refresh).not.toHaveBeenCalled();
  });
  it('leaves the current photo untouched when decoding fails', async () => {
    saveLocalAvatar(PHOTO); state.prepare.mockRejectedValue(new Error('Impossible de lire cette photo.'));
    await render(); await choose(); expect(host.querySelector('[role="alert"]')?.textContent).toContain('Impossible de lire');
    expect(host.querySelector('img')?.src).toBe(PHOTO); expect(state.upload).not.toHaveBeenCalled();
  });
});
