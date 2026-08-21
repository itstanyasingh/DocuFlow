import * as XLSX from 'xlsx';
import { textToPdf } from './pdfEngine';

/**
 * Convert CSV text or File to XLSX workbook binary array
 */
export function csvToXlsx(csvText: string, sheetName: string = 'Sheet1'): Uint8Array {
  const workbook = XLSX.read(csvText, { type: 'string' });
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

/**
 * Convert XLSX ArrayBuffer to CSV string
 */
export function xlsxToCsv(arrayBuffer: ArrayBuffer, sheetIndex: number = 0): string {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new Error('No valid sheet found in workbook.');
  }
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(worksheet);
}

/**
 * Convert XLSX ArrayBuffer to structured JSON rows
 */
export function xlsxToJson(arrayBuffer: ArrayBuffer, sheetIndex: number = 0): any[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new Error('No valid sheet found in workbook.');
  }
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

/**
 * Convert 2D Table Array (headers + rows) into XLSX binary
 */
export function tableToXlsx(headers: string[], rows: string[][], sheetName: string = 'Data'): Uint8Array {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

/**
 * Convert JSON objects array into XLSX binary
 */
export function jsonToXlsx(jsonData: any[], sheetName: string = 'Export'): Uint8Array {
  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

/**
 * Convert XLSX spreadsheet to a structured, printable PDF document
 */
export async function xlsxToPdf(arrayBuffer: ArrayBuffer, fileName: string): Promise<Uint8Array> {
  const csv = xlsxToCsv(arrayBuffer, 0);
  const rows = csv.split('\n').filter(r => r.trim().length > 0);
  
  // Format into aligned table lines
  const formattedLines: string[] = [];
  formattedLines.push(`Spreadsheet Report: ${fileName}`);
  formattedLines.push('='.repeat(60));
  formattedLines.push('');

  for (const row of rows) {
    const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    formattedLines.push(cols.join('   |   '));
  }

  return await textToPdf(formattedLines.join('\n'));
}
