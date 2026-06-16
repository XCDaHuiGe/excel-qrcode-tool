import QRCode from 'qrcode';
import type { MaterialRecord } from './types';

export type LabelImageOptions = {
  width: number;
  height: number;
  qrSize: number;
  fontFamily?: string;
};

export const PNG_LABEL_OPTIONS: LabelImageOptions = {
  width: 512,
  height: 600,
  qrSize: 430,
  fontFamily: 'Microsoft YaHei, PingFang SC, Arial, sans-serif',
};

export async function createQrDataUrl(text: string, size = 220): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export async function createLabelPngBlob(
  record: MaterialRecord,
  options: LabelImageOptions = PNG_LABEL_OPTIONS,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('当前浏览器不支持 Canvas');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, record.qrContent, {
    width: options.qrSize,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const qrX = (options.width - options.qrSize) / 2;
  context.drawImage(qrCanvas, qrX, 32, options.qrSize, options.qrSize);

  context.textAlign = 'center';
  context.fillStyle = '#111827';
  context.font = `700 ${fitFontSize(context, record.materialId, options.width - 44, 30)}px ${options.fontFamily}`;
  context.fillText(record.materialId, options.width / 2, options.qrSize + 78);

  if (record.extraText) {
    context.fillStyle = '#64748b';
    context.font = `500 ${fitFontSize(context, record.extraText, options.width - 44, 24)}px ${options.fontFamily}`;
    context.fillText(record.extraText, options.width / 2, options.qrSize + 116);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG 生成失败'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export async function createLabelPngDataUrl(
  record: MaterialRecord,
  options: LabelImageOptions = PNG_LABEL_OPTIONS,
): Promise<string> {
  const blob = await createLabelPngBlob(record, options);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('标签图片读取失败'));
    reader.readAsDataURL(blob);
  });
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
): number {
  let size = initialSize;
  while (size > 12) {
    context.font = `${size}px Microsoft YaHei, PingFang SC, Arial, sans-serif`;
    if (context.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 1;
  }
  return size;
}
