export interface UrlCitation {
  url: string;
  title?: string;
}

const PRIVATE_USE_CITATION =
  /\uE200(?:cite|filecite|navlist)\uE202[\s\S]*?\uE201/gi;
const GENERIC_PRIVATE_USE_CITATION =
  /[\uE000-\uF8FF](?:cite|filecite|navlist)[\uE000-\uF8FF][^\r\n]*?[\uE000-\uF8FF]/gi;
const REPLACEMENT_CITATION =
  /(?:\uFFFD){1,3}(?:cite|filecite|navlist)(?:\uFFFD){1,3}[^\r\n]*?(?:\uFFFD){1,3}/gi;

export function sanitizeCitationArtifacts(text: string): string {
  return text
    .replace(PRIVATE_USE_CITATION, "")
    .replace(GENERIC_PRIVATE_USE_CITATION, "")
    .replace(REPLACEMENT_CITATION, "")
    .replace(/[ \t]+([,.;:!?，。；：！？])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

export function formatUrlCitationSources(citations: UrlCitation[]): string {
  const unique = new Map<string, UrlCitation>();
  for (const citation of citations) {
    const url = safeHttpUrl(citation.url);
    if (!url || unique.has(url)) continue;
    unique.set(url, { url, title: citation.title });
  }
  if (unique.size === 0) return "";

  const lines = Array.from(unique.values()).map(
    (citation, index) =>
      `${index + 1}. [${citationLabel(citation)}](${citation.url})`,
  );
  return `\n\n### 来源\n\n${lines.join("\n")}`;
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function citationLabel(citation: UrlCitation): string {
  const title = (citation.title ?? "")
    .replaceAll("[", " ")
    .replaceAll("]", " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (title) return title.slice(0, 120);
  try {
    return new URL(citation.url).hostname.replace(/^www\./i, "") || "来源";
  } catch {
    return "来源";
  }
}
