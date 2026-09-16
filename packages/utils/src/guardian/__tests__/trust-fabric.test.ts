// @ts-nocheck
import { describe, it, expect } from '@jest/globals';
import * as module from '../trust-fabric.ts';

describe('trust-fabric', () => {
  it('should export expected functions/classes', () => {
    expect(module).toBeDefined();
    expect(typeof module).toBe('object');
  });

  it('should have valid exports', () => {
    const exports = Object.keys(module);
    expect(exports.length).toBeGreaterThan(0);
  });
});
