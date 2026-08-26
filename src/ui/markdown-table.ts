export type MarkdownTableAlignment = "left" | "center" | "right" | null;

export interface MarkdownTable {
  header: string[];
  alignments: MarkdownTableAlignment[];
  rows: string[][];
  nextLineIndex: number;
}

// Parse the GFM pipe-table shape without accepting raw HTML. Keeping this
// separate from the DOM renderer makes the streaming boundary testable: a
// header remains plain text until the complete delimiter row has arrived.
export function parseMarkdownTable(
  lines: string[],
  startLineIndex: number,
): MarkdownTable | null {
  const header = splitMarkdownTableRow(lines[startLineIndex] ?? "");
  const delimiters = splitMarkdownTableRow(lines[startLineIndex + 1] ?? "");
  if (
    !header ||
    !delimiters ||
    header.length === 0 ||
    delimiters.length !== header.length ||
    !delimiters.every(isTableDelimiter)
  ) {
    return null;
  }

  const rows: string[][] = [];
  let nextLineIndex = startLineIndex + 2;
  while (nextLineIndex < lines.length) {
    const cells = splitMarkdownTableRow(lines[nextLineIndex] ?? "");
    if (!cells) break;
    rows.push(normalizeRowWidth(cells, header.length));
    nextLineIndex += 1;
  }

  return {
    header,
    alignments: delimiters.map(tableAlignment),
    rows,
    nextLineIndex,
  };
}

function splitMarkdownTableRow(line: string): string[] | null {
  const source = line.trim();
  if (!source || !source.includes("|")) return null;

  const cells: string[] = [];
  let cell = "";
  let escaped = false;
  let inCode = false;
  for (const char of source) {
    if (escaped) {
      cell += char === "|" ? "|" : `\\${char}`;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "`") {
      inCode = !inCode;
      cell += char;
      continue;
    }
    if (char === "|" && !inCode) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }
  if (escaped) cell += "\\";
  cells.push(cell.trim());

  if (source.startsWith("|")) cells.shift();
  if (endsWithUnescapedPipe(source)) cells.pop();
  return cells.length > 0 ? cells : null;
}

function endsWithUnescapedPipe(value: string): boolean {
  if (!value.endsWith("|")) return false;
  let backslashes = 0;
  for (
    let index = value.length - 2;
    index >= 0 && value[index] === "\\";
    index--
  ) {
    backslashes += 1;
  }
  return backslashes % 2 === 0;
}

function isTableDelimiter(value: string): boolean {
  return /^:?-{3,}:?$/.test(value.replaceAll(" ", ""));
}

function tableAlignment(value: string): MarkdownTableAlignment {
  const compact = value.replaceAll(" ", "");
  if (compact.startsWith(":") && compact.endsWith(":")) return "center";
  if (compact.endsWith(":")) return "right";
  if (compact.startsWith(":")) return "left";
  return null;
}

function normalizeRowWidth(cells: string[], width: number): string[] {
  const normalized = cells.slice(0, width);
  while (normalized.length < width) normalized.push("");
  return normalized;
}
