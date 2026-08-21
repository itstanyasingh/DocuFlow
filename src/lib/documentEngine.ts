import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// 1. DOCX Preview & HTML Conversion
export async function convertDocxToHtml(file: File | ArrayBuffer): Promise<{ html: string; warnings: string[] }> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return {
    html: result.value,
    warnings: result.messages.map((m) => m.message),
  };
}

// 2. DOCX Text Extractor
export async function extractTextFromDocx(file: File | ArrayBuffer): Promise<string> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || 'No text content found in DOCX document.';
}

// 3. Excel Reader (XLSX / XLS)
export interface ExcelWorkbookData {
  sheetNames: string[];
  sheets: Record<string, Array<Record<string, any>>>;
}

export async function readExcelFile(file: File | ArrayBuffer): Promise<ExcelWorkbookData> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheets: Record<string, Array<Record<string, any>>> = {};
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    sheets[name] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  return {
    sheetNames: workbook.SheetNames,
    sheets,
  };
}

// 4. Excel to CSV
export async function convertExcelToCsv(file: File | ArrayBuffer, sheetName?: string): Promise<string> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(buffer, { type: 'array' });

  const targetSheet = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheet];

  if (!sheet) {
    throw new Error(`Sheet "${targetSheet}" not found in Excel file.`);
  }

  return XLSX.utils.sheet_to_csv(sheet);
}

// 5. CSV to Excel (XLSX)
export function convertCsvToExcel(csvText: string): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const parsed = Papa.parse(csvText, { skipEmptyLines: true });

  if (parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
    throw new Error('Malformed CSV content: ' + parsed.errors[0].message);
  }

  const sheet = XLSX.utils.aoa_to_sheet(parsed.data as any[][]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

// 6. CSV Viewer & Parse
export interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  errors: string[];
}

export function parseCsvContent(csvText: string): ParsedCsvData {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length === 0) {
    return { headers: [], rows: [], errors: ['CSV file is empty.'] };
  }

  const headers = parsed.data[0] || [];
  const rows = parsed.data.slice(1);
  const errors = parsed.errors.map((e) => `Row ${e.row}: ${e.message}`);

  return { headers, rows, errors };
}

// 7. CSV to JSON
export function convertCsvToJson(csvText: string): string {
  const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
  if (parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
    throw new Error('CSV Parsing Error: ' + parsed.errors[0].message);
  }
  return JSON.stringify(parsed.data, null, 2);
}

// 8. JSON to CSV
export function convertJsonToCsv(jsonText: string): string {
  let data: any;
  try {
    data = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error('Invalid JSON format: ' + err.message);
  }

  if (!Array.isArray(data)) {
    if (typeof data === 'object' && data !== null) {
      data = [data];
    } else {
      throw new Error('JSON content must be an array of objects to convert to CSV.');
    }
  }

  return Papa.unparse(data);
}
