import { Queue, Worker } from 'bullmq';
export declare const queue: Queue<any, any, string, any, any, string>;
export declare let worker: Worker | null;
export declare function startWorker(): Promise<void>;
export declare function stopWorker(): Promise<void>;
export declare function queueHealth(): Promise<{
    healthy: boolean;
    pending: number;
    active: number;
}>;
export { checkQueueHealth, getQueueMetrics } from './health';
//# sourceMappingURL=index.d.ts.map