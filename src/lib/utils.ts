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
export function stripMarkdownArtifacts(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '')       // # / ## headers
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.*?)\*/g, '$1')       // *italic*
    .replace(/^[-*]\s+/gm, '')         // bullet markers
    .trim();
}
