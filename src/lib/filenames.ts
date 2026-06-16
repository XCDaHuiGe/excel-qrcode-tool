import type { MaterialRecord } from './types';

const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

export function sanitizeFileNamePart(value: string): string {
  const sanitized = value.trim().replace(UNSAFE_FILENAME_CHARS, '_').replace(/\s+/g, '_');
  return sanitized || '未命名物资';
}

export function buildPngFileNames(records: MaterialRecord[]): string[] {
  const width = Math.max(3, String(records.length).length);
  const usedNames = new Map<string, number>();

  return records.map((record, index) => {
    const sequence = String(index + 1).padStart(width, '0');
    const baseName = `${sequence}_${sanitizeFileNamePart(record.materialId)}`;
    const usedCount = usedNames.get(baseName) ?? 0;
    usedNames.set(baseName, usedCount + 1);

    if (usedCount === 0) {
      return `${baseName}.png`;
    }

    return `${baseName}_${usedCount + 1}.png`;
  });
}
