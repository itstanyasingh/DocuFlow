export type CaseType =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'title'
  | 'sentencecase'
  | 'sentence'
  | 'camelcase'
  | 'camel'
  | 'snakecase'
  | 'snake'
  | 'kebabcase'
  | 'kebab'
  | 'constant';

export type TextCaseType = CaseType;

// 1. Case Converter
export function convertTextCase(text: string, type: CaseType | TextCaseType): string {
  switch (type) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
    case 'title':
      return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    case 'sentencecase':
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*|\.\s*)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
    case 'camelcase':
    case 'camel':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
    case 'snakecase':
    case 'snake':
      return text
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\W]+/g, '_')
        .toLowerCase()
        .replace(/^_|_$/g, '');
    case 'kebabcase':
    case 'kebab':
      return text
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s\W]+/g, '-')
        .toLowerCase()
        .replace(/^-|-$/g, '');
    case 'constant':
      return text
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\W]+/g, '_')
        .toUpperCase()
        .replace(/^_|_$/g, '');
    default:
      return text;
  }
}

// 2. Word Counter & Text Statistics
export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  avgWordLength: number;
}

export type TextStatistics = TextStats;

export function calculateTextStats(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;

  const wordsMatch = text.trim().match(/\b\w+\b/g);
  const words = wordsMatch ? wordsMatch.length : 0;

  const sentencesMatch = text.trim().match(/[^.!?]+[.!?]+/g);
  const sentences = sentencesMatch ? sentencesMatch.length : text.trim() ? 1 : 0;

  const lines = text ? text.split('\n').length : 0;

  const paragraphsMatch = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphs = paragraphsMatch.length || (text.trim() ? 1 : 0);

  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  const speakingTimeMinutes = Math.max(1, Math.ceil(words / 130));
  const avgWordLength = words > 0 ? parseFloat((charactersNoSpaces / words).toFixed(1)) : 0;

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
    speakingTimeMinutes,
    avgWordLength,
  };
}

export const analyzeTextStatistics = calculateTextStats;

// 3. Text Sorter
export function sortTextLines(
  text: string,
  sortMode: 'a-z' | 'z-a' | 'num-asc' | 'num-desc',
  removeDuplicates: boolean = false
): string {
  let lines = text.split('\n');

  if (removeDuplicates) {
    lines = Array.from(new Set(lines));
  }

  lines.sort((a, b) => {
    if (sortMode === 'a-z') return a.localeCompare(b);
    if (sortMode === 'z-a') return b.localeCompare(a);

    const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
    const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));

    if (!isNaN(numA) && !isNaN(numB)) {
      return sortMode === 'num-asc' ? numA - numB : numB - numA;
    }
    return sortMode === 'num-asc' ? a.localeCompare(b) : b.localeCompare(a);
  });

  return lines.join('\n');
}

// 4. Remove Duplicate Lines
export function removeDuplicateLines(text: string, caseSensitive: boolean = true): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = caseSensitive ? line : line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
  }

  return result.join('\n');
}

// 5. Text Cleaner
export function cleanTextContent(
  text: string,
  options: {
    removeExtraSpaces?: boolean;
    removeEmptyLines?: boolean;
    trimLines?: boolean;
    normalizeLineBreaks?: boolean;
  }
): string {
  let result = text;

  if (options.normalizeLineBreaks) {
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  if (options.removeExtraSpaces) {
    result = result.replace(/[ \t]+/g, ' ');
  }

  let lines = result.split('\n');

  if (options.trimLines) {
    lines = lines.map((l) => l.trim());
  }

  if (options.removeEmptyLines) {
    lines = lines.filter((l) => l.trim().length > 0);
  }

  return lines.join('\n');
}

// 6. Find & Replace Text
export function findAndReplaceText(
  text: string,
  findStr: string,
  replaceStr: string,
  caseSensitive: boolean = false,
  replaceFirstOnly: boolean = false
): { resultText: string; matchCount: number } {
  if (!findStr) {
    return { resultText: text, matchCount: 0 };
  }

  const flags = (caseSensitive ? '' : 'i') + (replaceFirstOnly ? '' : 'g');
  const escaped = findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, flags);

  const matches = text.match(regex);
  const matchCount = matches ? matches.length : 0;

  const resultText = text.replace(regex, replaceStr);

  return { resultText, matchCount };
}
