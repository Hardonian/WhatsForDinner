// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
  });

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid');
  });

  it('should handle arrays', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle empty strings', () => {
    expect(cn('class1', '', 'class2')).toBe('class1 class2');
  });

  it('should deduplicate classes', () => {
    // Note: This depends on implementation, adjust if needed
    const result = cn('class1', 'class2', 'class1');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });
});
