// @ts-nocheck
/**
 * Failure Injection Middleware
 * Injects various types of failures for testing
 */

export interface FailureConfig {
  type: 'cpu' | 'memory' | 'network' | 'database' | 'random';
  probability: number; // 0-1
  duration: number; // milliseconds
  severity: 'low' | 'medium' | 'high';
}

class FailureInjector {
  private config: FailureConfig;
  private isActive = false;

  constructor(config: FailureConfig) {
    this.config = config;
  }

  /**
   * Start failure injection
   */
  start(): void {
    this.isActive = true;
    this.injectFailures();
  }

  /**
   * Stop failure injection
   */
  stop(): void {
    this.isActive = false;
  }

  private injectFailures(): void {
    if (!this.isActive) return;

    if (Math.random() < this.config.probability) {
      this.executeFailure();
    }

    // Schedule next injection
    setTimeout(() => {
      this.injectFailures();
    }, 1000);
  }

  private executeFailure(): void {
    switch (this.config.type) {
      case 'cpu':
        this.injectCPUStress();
        break;
      case 'memory':
        this.injectMemoryLeak();
        break;
      case 'network':
        this.injectNetworkDelay();
        break;
      case 'database':
        this.injectDatabaseError();
        break;
      case 'random':
        this.injectRandomFailure();
        break;
    }
  }

  private injectCPUStress(): void {
    // Simulate CPU-intensive work
    const start = Date.now();
    while (Date.now() - start < this.config.duration) {
      Math.random() * Math.random();
    }
  }

  private injectMemoryLeak(): void {
    // Allocate memory that won't be garbage collected
    const chunks = [];
    for (let i = 0; i < this.config.severity === 'high' ? 100 : 10; i++) {
      chunks.push(new Array(100000).fill(Math.random()));
    }
  }

  private injectNetworkDelay(): void {
    // Simulate network delay
    const delay = this.config.severity === 'high' ? 5000 : 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private injectDatabaseError(): void {
    // Simulate database error
    throw new Error('Simulated database connection failure');
  }

  private injectRandomFailure(): void {
    const failures = ['cpu', 'memory', 'network', 'database'];
    const randomType = failures[Math.floor(Math.random() * failures.length)];
    
    // Temporarily change type and execute
    const originalType = this.config.type;
    this.config.type = randomType as any;
    this.executeFailure();
    this.config.type = originalType;
  }
}

export default FailureInjector;
