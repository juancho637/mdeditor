export interface ApiResponse<T> {
  data: T;
  path: string;
  request_id: string;
  duration: string;
  method: string;
}

export interface ApiErrorResponse {
  code_error: string;
  message: string;
  path: string;
  request_id: string;
  method: string;
}
