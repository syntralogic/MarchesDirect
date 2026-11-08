import { DEPARTMENTS } from '@/data/departments';

// 8 nov. : régions et libellé lisible d'une zone (« 02,59,60,62,80 » → « Hauts-de-France »), partagés entre
// « Mes suivis » et la page des annonces.
export const REGIONS: [string, string, string[]][] = [
  ['ara', 'Auvergne-Rhône-Alpes', ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74']],
  ['bfc', 'Bourgogne-Franche-Comté', ['21', '25', '39', '58', '70', '71', '89', '90']],
  ['bre', 'Bretagne', ['22', '29', '35', '56']], ['cvl', 'Centre-Val de Loire', ['18', '28', '36', '37', '41', '45']],
  ['cor', 'Corse', ['2A', '2B']], ['ges', 'Grand Est', ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88']],
  ['hdf', 'Hauts-de-France', ['02', '59', '60', '62', '80']], ['idf', 'Île-de-France', ['75', '77', '78', '91', '92', '93', '94', '95']],
  ['nor', 'Normandie', ['14', '27', '50', '61', '76']], ['naq', 'Nouvelle-Aquitaine', ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87']],
  ['occ', 'Occitanie', ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82']],
  ['pdl', 'Pays de la Loire', ['44', '49', '53', '72', '85']], ['pac', 'Provence-Alpes-Côte d’Azur', ['04', '05', '06', '13', '83', '84']],
];
/** « 33 » → « Gironde (33) » ; « 02,59,60,62,80 » → « Hauts-de-France » ; plusieurs départements → « 3 départements ». */
export function deptsLabel(dep: string): string {
  const list = dep.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
  if (!list.length) return 'Toute la France';
  const key = [...list].sort().join(',');
  const reg = REGIONS.find(r => [...r[2]].sort().join(',') === key);
  if (reg) return reg[1];
  if (list.length > 1 && list.length <= 4) return list.map(c => DEPARTMENTS.find(x => x.code === c)?.name || c).join(', ');
  if (list.length > 1) return `${list.length} départements`;
  const d = DEPARTMENTS.find(x => x.code === list[0]);
  return d ? `${d.name} (${d.code})` : `Département ${list[0]}`;
}
