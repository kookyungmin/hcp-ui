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

// Generic pageable body following Spring Page format
export type PageBody<T> = {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
};
