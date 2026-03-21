import { apiClient } from '@/common/adapters/api-client';
import type { AuthRepository } from '../../domain/repositories/auth-repository';
import type {
  AuthStatusResponse,
  SetupRequest,
  SetupResponse,
  SignInRequest,
  SignInResponse,
} from '../../domain/entities/auth';

// Wire format matches backend response (snake_case)
interface SetupWireResponse {
  access_token: string;
  refresh_token: string;
}

interface SignInWireResponse {
  access_token: string;
  refresh_token: string;
}

interface AuthStatusWireResponse {
  setup_completed: boolean;
}

function mapSetupResponse(wire: SetupWireResponse): SetupResponse {
  return {
    accessToken: wire.access_token,
    refreshToken: wire.refresh_token,
  };
}

function mapSignInResponse(wire: SignInWireResponse): SignInResponse {
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
    const response = await apiClient.post<SetupWireResponse>(
      '/api/auth/setup',
      data,
    );
    return mapSetupResponse(response.data);
  }

  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await apiClient.post<SignInWireResponse>(
      '/api/auth/sign-in',
      data,
    );
    return mapSignInResponse(response.data);
  }

  async getStatus(): Promise<AuthStatusResponse> {
    const response = await apiClient.get<AuthStatusWireResponse>(
      '/api/auth/status',
    );
    return mapAuthStatusResponse(response.data);
  }
}

export const authRepository = new AuthV1Repository();
