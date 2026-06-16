import { describe, expect, it } from 'vitest';
import { buildPngFileNames } from './filenames';

describe('buildPngFileNames', () => {
  it('prefixes files with padded sequence numbers and sanitizes unsafe characters', () => {
    const names = buildPngFileNames([
      { materialId: 'WZ/001', extraText: '', qrContent: 'WZ/001', sourceRowNumber: 2 },
      { materialId: 'WZ:001', extraText: '', qrContent: 'WZ:001', sourceRowNumber: 3 },
      { materialId: 'WZ-002', extraText: '', qrContent: 'WZ-002', sourceRowNumber: 4 },
    ]);

    expect(names).toEqual(['001_WZ_001.png', '002_WZ_001.png', '003_WZ-002.png']);
  });
});
