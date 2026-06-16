import type { MaterialRecord, RecordSummary, SheetRow } from './types';

export function cellToText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

export function buildMaterialRecords(
  rows: SheetRow[],
  materialIdColumn: string,
  extraColumn?: string,
): MaterialRecord[] {
  return rows.flatMap((row, index) => {
    const materialId = cellToText(row[materialIdColumn]);
    if (!materialId) {
      return [];
    }

    const extraText = extraColumn ? cellToText(row[extraColumn]) : '';

    return {
      sourceRowNumber: index + 2,
      materialId,
      extraText,
      qrContent: materialId,
    };
  });
}

export function summarizeRecords(
  rows: SheetRow[],
  records: MaterialRecord[],
  materialIdColumn: string,
): RecordSummary {
  const skippedBlankIdCount = rows.filter((row) => !cellToText(row[materialIdColumn])).length;
  const idCounts = new Map<string, number>();

  records.forEach((record) => {
    idCounts.set(record.materialId, (idCounts.get(record.materialId) ?? 0) + 1);
  });

  const duplicateIdCount = Array.from(idCounts.values()).reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );

  return {
    validCount: records.length,
    skippedBlankIdCount,
    duplicateIdCount,
  };
}
