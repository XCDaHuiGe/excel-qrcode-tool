import type { LayoutRisk, PdfLayout } from './types';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 10;
const CELL_GAP_MM = 3;
const TEXT_AREA_MM = 14;

type LayoutInput = {
  rows: number;
  columns: number;
  recordCount: number;
  longestMaterialIdLength: number;
  longestExtraTextLength: number;
};

export const PDF_PRESETS = [
  { label: '2x4', columns: 2, rows: 4 },
  { label: '3x3', columns: 3, rows: 3 },
  { label: '3x4', columns: 3, rows: 4 },
  { label: '4x5', columns: 4, rows: 5 },
] as const;

export function calculatePdfLayout(input: LayoutInput): PdfLayout {
  const rows = clampInteger(input.rows, 1, 10);
  const columns = clampInteger(input.columns, 1, 6);
  const availableWidth = A4_WIDTH_MM - PAGE_MARGIN_MM * 2 - CELL_GAP_MM * (columns - 1);
  const availableHeight = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2 - CELL_GAP_MM * (rows - 1);
  const cellWidthMm = availableWidth / columns;
  const cellHeightMm = availableHeight / rows;
  const qrSizeMm = Math.max(0, Math.min(cellWidthMm - 8, cellHeightMm - TEXT_AREA_MM - 8));
  const itemsPerPage = rows * columns;
  const totalPages = input.recordCount === 0 ? 0 : Math.ceil(input.recordCount / itemsPerPage);

  return {
    rows,
    columns,
    itemsPerPage,
    totalPages,
    pageWidthMm: A4_WIDTH_MM,
    pageHeightMm: A4_HEIGHT_MM,
    cellWidthMm,
    cellHeightMm,
    qrSizeMm,
    risk: calculateRisk(qrSizeMm, cellWidthMm, input.longestMaterialIdLength, input.longestExtraTextLength),
  };
}

export function getRiskMessage(risk: LayoutRisk): string {
  if (risk === 'blocked') {
    return '当前行列过密，二维码或文字可能无法正常使用，请减少行数或列数';
  }
  if (risk === 'warning') {
    return '二维码或文字接近推荐下限，请打印前确认可扫码';
  }
  return '当前布局适合打印';
}

function calculateRisk(
  qrSizeMm: number,
  cellWidthMm: number,
  longestMaterialIdLength: number,
  longestExtraTextLength: number,
): LayoutRisk {
  const materialTextLimit = Math.floor(cellWidthMm / 2.2);
  const extraTextLimit = Math.floor(cellWidthMm / 2.5);

  if (qrSizeMm < 20 || longestMaterialIdLength > materialTextLimit) {
    return 'blocked';
  }
  if (qrSizeMm < 25 || longestExtraTextLength > extraTextLimit) {
    return 'warning';
  }
  return 'safe';
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}
