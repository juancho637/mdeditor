import { apiClient } from '@/common/adapters/api-client';
import {
  AuthRepository,
  SetupRequest,
  SetupResponse,
  SignInRequest,
  SignInResponse,
  AuthStatusResponse,
} from '../../domain';

// Wire format: backend snake_case responses
interface TokensWireResponse {
  access_token: string;
  refresh_token: string;
}

interface AuthStatusWireResponse {
  setup_completed: boolean;
}

function mapTokensResponse(wire: TokensWireResponse): SignInResponse {
  return {
    accessToken: wire.access_token,
    refreshToken: wire.refresh_token,
  };
}

function mapAuthStatusResponse(
  wire: AuthStatusWireResponse,
): AuthStatusResponse {
  return {
    isSetupCompleted: wire.setup_completed,
  };
}

export class AuthV1Repository implements AuthRepository {
  async setup(data: SetupRequest): Promise<SetupResponse> {
    const response = await apiClient.post<TokensWireResponse>(
      '/api/auth/setup',
      data,
    );
    return mapTokensResponse(response.data);
  }

  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await apiClient.post<TokensWireResponse>(
      '/api/auth/sign-in',
      data,
    );
    return mapTokensResponse(response.data);
  }

  async refreshToken(refreshToken: string): Promise<SignInResponse> {
    const response = await apiClient.post<TokensWireResponse>(
      '/api/auth/refresh',
      {
        refresh_token: refreshToken,
      },
    );
    return mapTokensResponse(response.data);
  }

  async getStatus(): Promise<AuthStatusResponse> {
    const response =
      await apiClient.get<AuthStatusWireResponse>('/api/auth/status');
    return mapAuthStatusResponse(response.data);
  }
}

export const authRepository = new AuthV1Repository();
