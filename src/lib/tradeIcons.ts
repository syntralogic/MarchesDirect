import {
  Building2, Hammer, HardHat, TreePine, Home, Zap, Wrench,
  Thermometer, Layers, PaintBucket, DoorOpen, Grid3x3, Paintbrush,
  PanelTop, Route, Building,
} from 'lucide-react';
import type { ElementType } from 'react';

// A04/Q04 (contre-audit 15 Sep): the "Secteurs" cards on the homepage and
// /secteurs used to be 16 hand-written marketing families
// (data/mockData.ts) with their own icon-per-name map. Now that both pages
// render the real trades taxonomy from GET /api/trades (see trades.ts),
// this is the equivalent icon map, keyed by the trades table's stable
// `slug` column instead of a display name that could change with a
// translation or a rename.
//
// One entry per row currently seeded in schema.sql's `INSERT INTO trades`.
// A trade added later without an entry here falls back to Building2 in the
// callers below - never breaks, just less specific.
export const TRADE_ICONS: Record<string, ElementType> = {
  'gros-oeuvre': HardHat,
  demolition: Hammer,
  maconnerie: Building,
  charpente: TreePine,
  couverture: Home,
  electricite: Zap,
  plomberie: Wrench,
  cvc: Thermometer,
  isolation: Layers,
  platrerie: PanelTop,
  menuiserie: DoorOpen,
  carrelage: Grid3x3,
  peinture: Paintbrush,
  vitrerie: PaintBucket,
  vrd: Route,
  'batiment-general': Building2,
};

export function tradeIcon(slug: string): ElementType {
  return TRADE_ICONS[slug] || Building2;
}
