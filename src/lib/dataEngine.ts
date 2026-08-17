import * as XLSX from 'xlsx';

/**
 * 1. CSV to JSON parser (deterministic RFC-compliant)
 */
export function convertCsvToJson(csvText: string): any[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

/**
 * 2. JSON to CSV converter
 */
export function convertJsonToCsv(jsonData: any[] | string): string {
  const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
  if (!Array.isArray(data)) {
    throw new Error('Input must be a JSON array of objects');
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  return XLSX.utils.sheet_to_csv(worksheet);
}

/**
 * 3. JSON Formatter & Beautifier
 */
export function formatJsonString(rawJson: string, spaces: number = 2): string {
  const parsed = JSON.parse(rawJson);
  return JSON.stringify(parsed, null, spaces);
}

/**
 * 4. JSON Validator with exact error pinpointing
 */
export function validateJsonString(rawJson: string): { valid: boolean; error?: string; line?: number; column?: number } {
  try {
    JSON.parse(rawJson);
    return { valid: true };
  } catch (err: any) {
    const msg = err?.message || 'Invalid JSON syntax';
    // Try to extract line and column from error message
    const match = msg.match(/at position (\d+)/i);
    let line = 1;
    let column = 1;
    if (match && match[1]) {
      const pos = parseInt(match[1], 10);
      const lines = rawJson.substring(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
    return {
      valid: false,
      error: msg,
      line,
      column,
    };
  }
}

/**
 * 5. Merge multiple CSV files
 */
export function mergeCsvFiles(csvTexts: string[]): string {
  const allRows: any[] = [];
  for (const csv of csvTexts) {
    const rows = convertCsvToJson(csv);
    allRows.push(...rows);
  }
  return convertJsonToCsv(allRows);
}

/**
 * 6. Split CSV by row chunk size
 */
export function splitCsvFile(csvText: string, rowsPerChunk: number = 1000): string[] {
  const rows = convertCsvToJson(csvText);
  if (rows.length <= rowsPerChunk) {
    return [csvText];
  }

  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += rowsPerChunk) {
    const chunkData = rows.slice(i, i + rowsPerChunk);
    chunks.push(convertJsonToCsv(chunkData));
  }
  return chunks;
}
