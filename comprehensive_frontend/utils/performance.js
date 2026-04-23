/**
 * Simple performance monitoring
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  start(label) {
    this.metrics[label] = {
      start: performance.now()
    };
  }

  end(label) {
    if (this.metrics[label]) {
      const duration = performance.now() - this.metrics[label].start;
      this.metrics[label].duration = duration;
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`⚠️  Slow operation: ${label} took ${duration.toFixed(0)}ms`);
      } else {
        console.log(`⚡ ${label}: ${duration.toFixed(0)}ms`);
      }
      
      return duration;
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

export const perfMonitor = new PerformanceMonitor();
