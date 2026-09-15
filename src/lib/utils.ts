import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

// Safety net for AI-generated text (ai_summary etc.) stored before backend
// prompts were fixed to forbid markdown (client's 8 Sep screenshot: raw
// "# Résumé..." / "**bold**" markers rendering verbatim in plain <p> tags
// with no markdown renderer). Only strips symbols, never touches the
// actual wording - new AI output shouldn't have anything for this to strip.
// Known raw source codes (BOAMP/DECP `nature`/`procedure` fields, etc.) that
// sometimes leak straight into AI-extracted facts instead of being
// translated to readable French. Add specific known codes here; anything
// unknown falls back to a generic SNAKE_CASE -> "Snake case" conversion so
// we never show a raw underscore-separated code, even for codes not yet
// mapped below.
const RAW_LABEL_MAP: Record<string, string> = {
  APPEL_OFFRE: "Appel d'offres",
  APPEL_OFFRE_OUVERT: "Appel d'offres ouvert",
  APPEL_OFFRE_RESTREINT: "Appel d'offres restreint",
  PROCEDURE_ADAPTEE: 'Procédure adaptée',
  MARCHE_NEGOCIE: 'Marché négocié',
  DIALOGUE_COMPETITIF: 'Dialogue compétitif',
  CONCOURS: 'Concours',
  ACCORD_CADRE: 'Accord-cadre',
  MARCHE: 'Marché',
  MARCHE_PUBLIC: 'Marché public',
  PARTENARIAT_INNOVATION: "Partenariat d'innovation",
};

// Looks like a raw enum/code straight from source data: all caps (or
// digits), words separated by underscores, no lowercase letters at all.
const RAW_CODE_PATTERN = /^[A-Z0-9]+(_[A-Z0-9]+)*$/;

export function humanizeRawLabel(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  const known = RAW_LABEL_MAP[trimmed];
  if (known) return known;
  if (!RAW_CODE_PATTERN.test(trimmed)) return value; // already human text, leave as-is
  const words = trimmed.toLowerCase().split('_').filter(Boolean);
  if (words.length === 0) return value;
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}

export function stripMarkdownArtifacts(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '')       // # / ## headers
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.*?)\*/g, '$1')       // *italic*
    .replace(/^[-*]\s+/gm, '')         // bullet markers
    .trim();
}
