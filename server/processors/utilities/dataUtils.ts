import * as XLSX from 'xlsx';

export function convertCsvToExcelBuffer(csvBuffer: Buffer): Buffer {
  const csvString = csvBuffer.toString('utf-8');
  const workbook = XLSX.read(csvString, { type: 'string' });
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function convertExcelToCsvBuffer(excelBuffer: Buffer): Buffer {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const csvString = XLSX.utils.sheet_to_csv(worksheet);
  return Buffer.from(csvString, 'utf-8');
}

export function convertCsvToJsonBuffer(csvBuffer: Buffer): Buffer {
  const csvString = csvBuffer.toString('utf-8');
  const workbook = XLSX.read(csvString, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  return Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
}

export function convertJsonToCsvBuffer(jsonBuffer: Buffer): Buffer {
  const jsonString = jsonBuffer.toString('utf-8');
  const data = JSON.parse(jsonString);
  const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
  const csvString = XLSX.utils.sheet_to_csv(worksheet);
  return Buffer.from(csvString, 'utf-8');
}

export function formatJsonBuffer(jsonBuffer: Buffer): Buffer {
  const jsonString = jsonBuffer.toString('utf-8');
  const parsed = JSON.parse(jsonString);
  return Buffer.from(JSON.stringify(parsed, null, 2), 'utf-8');
}
