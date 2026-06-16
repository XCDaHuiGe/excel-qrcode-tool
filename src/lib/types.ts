export type SheetRow = Record<string, unknown>;

export type MaterialRecord = {
  sourceRowNumber: number;
  materialId: string;
  extraText: string;
  qrContent: string;
};

export type RecordSummary = {
  validCount: number;
  skippedBlankIdCount: number;
  duplicateIdCount: number;
};

export type LayoutRisk = 'safe' | 'warning' | 'blocked';

export type PdfLayout = {
  rows: number;
  columns: number;
  itemsPerPage: number;
  totalPages: number;
  pageWidthMm: number;
  pageHeightMm: number;
  cellWidthMm: number;
  cellHeightMm: number;
  qrSizeMm: number;
  risk: LayoutRisk;
};
