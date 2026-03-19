export enum AsyncStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type ApiResponse<T> = {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  message: string;
  code: string;
  details?: Record<string, unknown>;
};
