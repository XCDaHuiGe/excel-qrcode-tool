import { describe, expect, it } from 'vitest';
import { getDatasetMode, shouldYieldToBrowser } from './performance';

describe('getDatasetMode', () => {
  it('uses normal mode below 2000 rows and large mode at 2000 rows', () => {
    expect(getDatasetMode(1999)).toBe('normal');
    expect(getDatasetMode(2000)).toBe('large');
    expect(getDatasetMode(3500)).toBe('large');
  });
});

describe('shouldYieldToBrowser', () => {
  it('yields every batch interval but not for the first item', () => {
    expect(shouldYieldToBrowser(0, 25)).toBe(false);
    expect(shouldYieldToBrowser(24, 25)).toBe(false);
    expect(shouldYieldToBrowser(25, 25)).toBe(true);
    expect(shouldYieldToBrowser(50, 25)).toBe(true);
  });
});
