// Anciennes adresses /actualites/aN (6 textes de remplissage retirés le 6 nov.) → page équivalente.
// Même table côté serveur dans vercel.json (redirections 301) : garder les deux en accord.
export const ACTU_REDIRECTS: Record<string, string> = {
  a1: '/guides/dc1-dc2-dume',
  a2: '/guides',
  a3: '/marches-publics',
  a4: '/guides/dc1-dc2-dume',
  a5: '/guides/memoire-technique',
  a6: '/guides',
};
