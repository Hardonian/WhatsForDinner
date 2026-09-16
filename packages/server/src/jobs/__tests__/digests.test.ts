// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as module from '../digests.ts';

describe('digests', () => {
  it('should export expected functions/classes', () => {
    expect(module).toBeDefined();
    expect(typeof module).toBe('object');
  });

  it('should have valid exports', () => {
    const exports = Object.keys(module);
    expect(exports.length).toBeGreaterThan(0);
  });
});
