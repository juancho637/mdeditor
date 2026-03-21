export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSetupCompleted: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SetupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SetupResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignInResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthStatusResponse {
  isSetupCompleted: boolean;
}
