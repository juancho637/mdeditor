import type {
  AuthStatusResponse,
  SetupRequest,
  SetupResponse,
  SignInRequest,
  SignInResponse,
} from '../entities/auth';

export interface AuthRepository {
  setup(data: SetupRequest): Promise<SetupResponse>;
  signIn(data: SignInRequest): Promise<SignInResponse>;
  getStatus(): Promise<AuthStatusResponse>;
}
