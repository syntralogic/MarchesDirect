import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import SavedMarketsBanner from '@/components/home/SavedMarketsBanner';
import MonEspacePage from '@/pages/MonEspacePage';
const state = vi.hoisted(() => ({savedIds: new Set<string>(), authenticated:false, getMany:vi.fn()}));
vi.mock('@/contexts/FavoritesContext', () => ({ useFavorites: () => ({savedIds:state.savedIds,loading:false}) }));
vi.mock('@/contexts/AuthContext', () => ({useAuth:()=>({isAuthenticated:state.authenticated,company:null})}));
vi.mock('@/lib/apiClient',()=>({opportunitiesApi:{getMany:state.getMany},suiviApi:{list:async()=>[]},siretApi:{status:async()=>null}}));
vi.mock('@/lib/visitorTracking',()=>({getSessionId:()=> 'test-browser'}));
vi.mock('@/lib/favMeta',()=>({metaOf:()=>({note:''}),setMeta:vi.fn()}));
vi.mock('@/components/fiche/HelpOptions',()=>({default:()=>null}));
vi.mock('@/components/suivi/DossierTimeline',()=>({MiniProgress:()=>null,stateLine:()=>({})}));
vi.mock('@/components/pwa/InstallOffer',()=>({default:()=>null}));
vi.mock('@/components/espace/DocumentsTab',()=>({default:()=>null}));
vi.mock('@/components/espace/SecurityCard',()=>({default:()=>null}));
vi.mock('@/components/espace/SavedSearchesTab',()=>({default:()=>null}));
let host:HTMLDivElement,root:Root;
const a={id:'a',title:'Installation de chauffage'},b={id:'b',title:'Nettoyage des locaux'};
async function render(){await act(async()=>{root.render(<MemoryRouter initialEntries={['/mon-espace?onglet=favoris']}><SavedMarketsBanner/><MonEspacePage/></MemoryRouter>);});}
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;state.savedIds=new Set(['a','b']);state.authenticated=false;state.getMany.mockReset();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
describe('home and saved announcements',()=>{
 it('shows the same two local bookmarks and links the home banner to that selection',async()=>{
  state.getMany.mockResolvedValue([a,b]);await render();
  expect(host.textContent).toContain('2 marchés enregistrés');expect(host.textContent).toContain('Enregistrés · 2');
  expect(host.textContent).toContain(a.title);expect(host.textContent).toContain(b.title);
  expect(host.querySelector('a')?.getAttribute('href')).toBe('/mon-espace?onglet=favoris');
  expect(state.getMany).toHaveBeenCalledWith(['a','b']);
 });
 it('does not turn a server failure into zero and retry restores the cards',async()=>{
  state.getMany.mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce([a,b]);await render();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('n’ont pas pu être chargées');
  expect(host.textContent).toContain('Enregistrés · 2');expect(host.textContent).not.toContain('Aucun favori');
  const retry=Array.from(host.querySelectorAll('button')).find(x=>x.textContent==='Réessayer')!;
  await act(async()=>retry.click());expect(host.querySelector('[role="alert"]')).toBeNull();expect(host.textContent).toContain(b.title);
 });
 it('includes local bookmarks awaiting account synchronisation after login',async()=>{
  state.authenticated=true;state.getMany.mockResolvedValue([a,b]);await render();
  expect(state.getMany).toHaveBeenCalledWith(['a','b']);expect(host.textContent).toContain(b.title);
 });
 it('explains an unavailable record while retaining the saved count',async()=>{
  state.getMany.mockResolvedValue([a]);await render();expect(host.textContent).toContain('Enregistrés · 2');
  expect(host.textContent).toContain('1 annonce enregistrée n’est plus accessible');expect(host.textContent).not.toContain('Aucun favori');
 });
 it('shows empty only for an empty saved selection',async()=>{
  state.savedIds=new Set();state.getMany.mockResolvedValue([]);await render();expect(host.textContent).toContain('Enregistrés · 0');
  expect(host.textContent).toContain('Aucun favori');expect(host.textContent).not.toContain('marchés enregistrés');
 });
});
