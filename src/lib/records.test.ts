import { describe, expect, it } from 'vitest';
import { buildMaterialRecords, summarizeRecords } from './records';

const rows = [
  { 物资编码: ' WZ-001 ', 物资名称: '工业传感器' },
  { 物资编码: '', 物资名称: '空 ID 行' },
  { 物资编码: 'WZ-001', 物资名称: '' },
  { 物资编码: 'WZ-002', 物资名称: '控制模块' },
];

describe('buildMaterialRecords', () => {
  it('skips blank material IDs and keeps duplicate IDs in source order', () => {
    const records = buildMaterialRecords(rows, '物资编码', '物资名称');

    expect(records).toEqual([
      {
        sourceRowNumber: 2,
        materialId: 'WZ-001',
        extraText: '工业传感器',
        qrContent: 'WZ-001',
      },
      {
        sourceRowNumber: 4,
        materialId: 'WZ-001',
        extraText: '',
        qrContent: 'WZ-001',
      },
      {
        sourceRowNumber: 5,
        materialId: 'WZ-002',
        extraText: '控制模块',
        qrContent: 'WZ-002',
      },
    ]);
  });
});

describe('summarizeRecords', () => {
  it('reports valid records, skipped blank IDs, and duplicate IDs', () => {
    const records = buildMaterialRecords(rows, '物资编码', '物资名称');

    expect(summarizeRecords(rows, records, '物资编码')).toEqual({
      validCount: 3,
      skippedBlankIdCount: 1,
      duplicateIdCount: 1,
    });
  });
});
