import * as XLSX from 'xlsx';
import type { SheetRow } from './types';

export type ParsedWorkbook = {
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: SheetRow[];
  previewRows: SheetRow[];
};

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('文件为空或没有工作表');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (matrix.length < 2) {
    throw new Error('Excel 必须包含表头和至少一行数据');
  }

  const headers = matrix[0].map((value, index) => {
    const header = String(value ?? '').trim();
    return header || `未命名列${index + 1}`;
  });

  if (headers.every((header) => !header || header.startsWith('未命名列'))) {
    throw new Error('未识别到有效表头');
  }

  const rows = matrix.slice(1).map((values) => {
    const row: SheetRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    headers,
    rows,
    previewRows: rows.slice(0, 20),
  };
}
