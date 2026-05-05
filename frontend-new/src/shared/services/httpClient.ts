import type { ApiResponse } from '../types';

/** Minimal request options accepted by the HTTP client stub. */
export interface HttpRequestOptions {
  /** HTTP method for the request. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Optional request body. */
  body?: unknown;
}

/** Mock HTTP client used until real API integration is added. */
export const httpClient = {
  /** Returns a mocked successful API response. */
  async request<T>(url: string, options: HttpRequestOptions = {}): Promise<ApiResponse<T>> {
    return {
      data: undefined as T,
      message: `Mock request to ${url} with ${options.method ?? 'GET'}`,
      success: true,
    };
  },
};
