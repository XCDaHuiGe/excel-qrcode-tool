import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { buildPngFileNames } from './filenames';
import type { MaterialRecord, PdfLayout } from './types';
import { createLabelPngBlob, createLabelPngDataUrl, PNG_LABEL_OPTIONS } from './qr';

export async function exportZip(records: MaterialRecord[]): Promise<Blob> {
  const zip = new JSZip();
  const names = buildPngFileNames(records);

  for (let index = 0; index < records.length; index += 1) {
    const blob = await createLabelPngBlob(records[index]);
    zip.file(names[index], blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function exportPdf(
  records: MaterialRecord[],
  layout: PdfLayout,
  showCutLines: boolean,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const margin = 10;
  const gap = 3;
  const labelRatio = PNG_LABEL_OPTIONS.width / PNG_LABEL_OPTIONS.height;

  for (let index = 0; index < records.length; index += 1) {
    if (index > 0 && index % layout.itemsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = index % layout.itemsPerPage;
    const row = Math.floor(pageIndex / layout.columns);
    const column = pageIndex % layout.columns;
    const x = margin + column * (layout.cellWidthMm + gap);
    const y = margin + row * (layout.cellHeightMm + gap);
    const record = records[index];

    if (showCutLines) {
      doc.setDrawColor(210, 220, 235);
      doc.setLineWidth(0.1);
      doc.rect(x, y, layout.cellWidthMm, layout.cellHeightMm);
    }

    const labelDataUrl = await createLabelPngDataUrl(record);
    const maxWidth = layout.cellWidthMm - 4;
    const maxHeight = layout.cellHeightMm - 4;
    const drawWidth = Math.min(maxWidth, maxHeight * labelRatio);
    const drawHeight = drawWidth / labelRatio;
    const labelX = x + (layout.cellWidthMm - drawWidth) / 2;
    const labelY = y + (layout.cellHeightMm - drawHeight) / 2;

    doc.addImage(labelDataUrl, 'PNG', labelX, labelY, drawWidth, drawHeight);
  }

  return doc.output('blob');
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
