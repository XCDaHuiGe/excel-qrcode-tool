import { describe, expect, it } from 'vitest';
import { matrixToRows } from './excel';

describe('matrixToRows', () => {
  it('drops fully blank rows while preserving partially filled rows', () => {
    const result = matrixToRows([
      ['物资编码', '物资名称', '数量'],
      ['WZ-001', '工业传感器', '12'],
      ['', '', ''],
      ['WZ-002', '', ''],
      ['   ', '   ', '   '],
    ]);

    expect(result.headers).toEqual(['物资编码', '物资名称', '数量']);
    expect(result.rows).toEqual([
      { 物资编码: 'WZ-001', 物资名称: '工业传感器', 数量: '12' },
      { 物资编码: 'WZ-002', 物资名称: '', 数量: '' },
    ]);
    expect(result.blankRowCount).toBe(2);
  });
});
