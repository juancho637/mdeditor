import type { User } from '../entities/user.entity';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSetupCompleted: boolean;
  isLoading: boolean;
  error: string | null;
}
