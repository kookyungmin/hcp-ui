export type ApiEnvelope<T> = {
  timestamp: string;
  status: number;
  code: string;
  body: T;
};

export type ApiErrorBody = {
  timestamp: string;
  status: number;
  code: string;
  message?: string;
  path?: string;
};
