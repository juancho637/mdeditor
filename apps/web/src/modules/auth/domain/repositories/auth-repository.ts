import type { SetupRequest } from '../types/setup-request.type';
import type { SetupResponse } from '../types/setup-response.type';
import type { SignInRequest } from '../types/sign-in-request.type';
import type { SignInResponse } from '../types/sign-in-response.type';
import type { AuthStatusResponse } from '../types/auth-status-response.type';

export interface AuthRepository {
  setup(data: SetupRequest): Promise<SetupResponse>;
  signIn(data: SignInRequest): Promise<SignInResponse>;
  logout(): Promise<void>;
  getStatus(): Promise<AuthStatusResponse>;
}
