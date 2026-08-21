import Papa from 'papaparse';

// 1. JSON Formatter
export function formatJsonString(jsonStr: string, indentSpaces: number = 2): { result: string; isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = JSON.stringify(parsed, null, indentSpaces);
    return { result, isValid: true };
  } catch (err: any) {
    return { result: jsonStr, isValid: false, error: err.message };
  }
}

// 2. JSON Minifier
export function minifyJsonString(jsonStr: string): { result: string; isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = JSON.stringify(parsed);
    return { result, isValid: true };
  } catch (err: any) {
    return { result: jsonStr, isValid: false, error: err.message };
  }
}

// 3. JSON Validator with Line & Char Error Pinpointing
export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

export function validateJsonString(jsonStr: string): JsonValidationResult {
  if (!jsonStr || jsonStr.trim() === '') {
    return { isValid: false, error: 'JSON text is empty.' };
  }

  try {
    JSON.parse(jsonStr);
    return { isValid: true };
  } catch (err: any) {
    const errorMsg: string = err.message || 'JSON Parse Error';
    let line: number | undefined;
    let column: number | undefined;

    // Extract line/column from standard error message formats (e.g. "at position 42" or "line 3 column 5")
    const posMatch = errorMsg.match(/at position (\d+)/i) || errorMsg.match(/position (\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = jsonStr.slice(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    const lineColMatch = errorMsg.match(/line (\d+) column (\d+)/i);
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    }

    return {
      isValid: false,
      error: errorMsg,
      errorLine: line,
      errorColumn: column,
    };
  }
}

// 4. CSV Formatter & Align
export function formatCsvString(csvStr: string): { result: string; headers: string[]; rows: string[][] } {
  const parsed = Papa.parse<string[]>(csvStr, { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length === 0) {
    return { result: '', headers: [], rows: [] };
  }

  const headers = parsed.data[0] || [];
  const rows = parsed.data.slice(1);
  const result = Papa.unparse(parsed.data);

  return { result, headers, rows };
}

// 5. CSV Validator
export interface CsvValidationResult {
  isValid: boolean;
  totalRows: number;
  columnCount: number;
  errors: string[];
  warnings: string[];
}

export function validateCsvString(csvStr: string): CsvValidationResult {
  if (!csvStr || csvStr.trim() === '') {
    return { isValid: false, totalRows: 0, columnCount: 0, errors: ['CSV content is empty.'], warnings: [] };
  }

  const parsed = Papa.parse<string[]>(csvStr, { skipEmptyLines: false });
  const errors: string[] = [];
  const warnings: string[] = [];

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push(`Row ${err.row !== undefined ? err.row + 1 : 'unknown'}: ${err.message}`);
    }
  }

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    return { isValid: false, totalRows: 0, columnCount: 0, errors: ['CSV contains no rows.'], warnings: [] };
  }

  const expectedCols = rows[0].length;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length !== expectedCols) {
      warnings.push(`Row ${i + 1} has ${row.length} columns (expected ${expectedCols} based on header).`);
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    totalRows: rows.length,
    columnCount: expectedCols,
    errors,
    warnings,
  };
}

// 6. CSV <-> JSON Conversions
export function convertCsvToJson(csvStr: string): any[] {
  const parsed = Papa.parse(csvStr, { header: true, skipEmptyLines: true });
  if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
    throw new Error(parsed.errors[0].message || 'Failed to parse CSV string.');
  }
  return parsed.data;
}

export function convertJsonToCsv(jsonInput: string | object[]): string {
  let data: any = jsonInput;
  if (typeof jsonInput === 'string') {
    data = JSON.parse(jsonInput);
  }
  if (!Array.isArray(data)) {
    throw new Error('Input must be a JSON array of objects.');
  }
  return Papa.unparse(data);
}
