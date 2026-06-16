import { describe, expect, it } from 'vitest';
import { calculatePdfLayout, getRiskMessage } from './layout';

describe('calculatePdfLayout', () => {
  it('calculates capacity, page count, and a safe risk for 3 by 4', () => {
    const layout = calculatePdfLayout({
      rows: 4,
      columns: 3,
      recordCount: 228,
      longestMaterialIdLength: 11,
      longestExtraTextLength: 5,
    });

    expect(layout.itemsPerPage).toBe(12);
    expect(layout.totalPages).toBe(19);
    expect(layout.risk).toBe('safe');
    expect(layout.qrSizeMm).toBeGreaterThanOrEqual(25);
  });

  it('blocks PDF export when QR modules become too dense', () => {
    const layout = calculatePdfLayout({
      rows: 10,
      columns: 6,
      recordCount: 228,
      longestMaterialIdLength: 28,
      longestExtraTextLength: 20,
    });

    expect(layout.risk).toBe('blocked');
    expect(getRiskMessage(layout.risk)).toContain('无法正常使用');
  });
});
