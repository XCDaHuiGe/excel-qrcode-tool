export type DatasetMode = 'normal' | 'large';

export const LARGE_DATASET_ROW_THRESHOLD = 2000;
export const EXPORT_YIELD_INTERVAL = 25;

export type ExportProgress = {
  completed: number;
  total: number;
  phase: string;
};

export type ProgressHandler = (progress: ExportProgress) => void;

export function getDatasetMode(rowCount: number): DatasetMode {
  return rowCount >= LARGE_DATASET_ROW_THRESHOLD ? 'large' : 'normal';
}

export function shouldYieldToBrowser(index: number, interval = EXPORT_YIELD_INTERVAL): boolean {
  return index > 0 && index % interval === 0;
}

export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}
