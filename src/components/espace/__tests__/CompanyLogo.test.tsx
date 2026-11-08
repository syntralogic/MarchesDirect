import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import ProfileAvatar from '@/components/ProfileAvatar';
const state = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user:null, company:null, loading:false, isAuthenticated:false }) }));
vi.mock('@/lib/apiClient', () => ({ apiClient: { get: state.get } }));
let host:HTMLDivElement, root:Root;
const dataUrl='data:image/png;base64,cGhvdG8=';
beforeEach(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();state.get.mockReset();host=document.createElement('div');document.body.append(host);root=createRoot(host); });
afterEach(async () => { await act(async () => root.unmount());host.remove(); });
async function render() { await act(async () => root.render(<ProfileAvatar />)); }
it('displays only a logo verified by the server for the selected SIRET',async()=>{
  localStorage.setItem('md_company_siret','12345678900011');
  state.get.mockResolvedValue({data:{logo:{dataUrl,source:'https://entreprise.example/'}}});
  await render(); expect(state.get).toHaveBeenCalledWith('/public/company-logos/12345678900011',{timeout:12000});
  expect(host.querySelector('img')?.alt).toBe('Logo de l’entreprise');
});
it('removes the old logo immediately when another company has no verified logo',async()=>{
  localStorage.setItem('md_company_siret','22345678900011');
  state.get.mockResolvedValueOnce({data:{logo:{dataUrl,source:'https://entreprise.example/'}}}).mockResolvedValueOnce({data:{logo:null}});
  await render(); expect(host.querySelector('img')).not.toBeNull();
  await act(async()=>{ localStorage.setItem('md_company_siret','32345678900011');window.dispatchEvent(new Event('md:company-changed')); });
  expect(host.querySelector('img')).toBeNull();
});
it('keeps the manually selected photo ahead of any automatic lookup',async()=>{
  localStorage.setItem('md_company_siret','42345678900011');localStorage.setItem('md:local-avatar:v1','data:image/jpeg;base64,bWFudWFs');
  await render();expect(state.get).not.toHaveBeenCalled();expect(host.querySelector('img')?.alt).toBe('Photo de profil');
});
it('leaves the standard icon when the response contains an unapproved image format',async()=>{
  localStorage.setItem('md_company_siret','52345678900011');
  state.get.mockResolvedValue({data:{logo:{dataUrl:'data:image/svg+xml;base64,eA==',source:'https://entreprise.example/'}}});
  await render();expect(host.querySelector('img')).toBeNull();
});
