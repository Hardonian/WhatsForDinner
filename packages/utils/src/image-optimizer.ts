// @ts-nocheck
/**
 * Image Optimization Utilities
 * Helper functions for responsive images and modern formats
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: boolean;
}

export class ImageOptimizer {
  private static readonly MODERN_FORMATS = ['webp', 'avif'];
  private static readonly FALLBACK_FORMAT = 'jpeg';
  
  /**
   * Generate responsive image sources
   */
  static generateResponsiveSources(
    baseSrc: string,
    widths: number[],
    options: ImageOptimizationOptions = {}
  ): string[] {
    const { quality = 85, format = 'webp' } = options;
    
    return widths.map(width => 
      `${baseSrc}?w=${width}&q=${quality}&f=${format}`
    );
  }
  
  /**
   * Generate srcset for responsive images
   */
  static generateSrcSet(
    baseSrc: string,
    widths: number[],
    options: ImageOptimizationOptions = {}
  ): string {
    const sources = this.generateResponsiveSources(baseSrc, widths, options);
    
    return sources
      .map((src, index) => `${src} ${widths[index]}w`)
      .join(', ');
  }
  
  /**
   * Check if browser supports modern formats
   */
  static supportsModernFormats(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  /**
   * Get optimal image format for current browser
   */
  static getOptimalFormat(): string {
    if (this.supportsModernFormats()) {
      return 'webp';
    }
    return this.FALLBACK_FORMAT;
  }
  
  /**
   * Generate blur placeholder
   */
  static generateBlurPlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }
  
  /**
   * Calculate optimal sizes for responsive images
   */
  static calculateSizes(breakpoints: { [key: string]: number }): string {
    const sizes = Object.entries(breakpoints)
      .map(([breakpoint, width]) => `(max-width: ${breakpoint}px) ${width}vw`)
      .join(', ');
    
    return `${sizes}, 100vw`;
  }
}

export default ImageOptimizer;
