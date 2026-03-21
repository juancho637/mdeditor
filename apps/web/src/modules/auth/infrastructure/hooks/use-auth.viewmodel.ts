'use client';

import { useCallback } from 'react';
import { useAuthStore } from '../state/auth.state';
import { authRepository } from '../repositories/auth-v1.repository';
import type { SetupRequest, SignInRequest } from '../../domain/entities/auth';

export function useAuthViewModel() {
  const {
    isAuthenticated,
    isSetupCompleted,
    isLoading,
    error,
    setSetupCompleted,
    setLoading,
    setError,
    setTokens,
    setAuthenticated,
    logout,
  } = useAuthStore();

  const setup = useCallback(
    async (data: SetupRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authRepository.setup(data);
        setTokens(response.accessToken, response.refreshToken);
        setSetupCompleted(true);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al crear la cuenta';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setTokens, setSetupCompleted],
  );

  const signIn = useCallback(
    async (data: SignInRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authRepository.signIn(data);
        setTokens(response.accessToken, response.refreshToken);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Credenciales incorrectas';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setTokens],
  );

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await authRepository.getStatus();
      setSetupCompleted(status.isSetupCompleted);
      return status;
    } catch {
      setSetupCompleted(false);
      return { isSetupCompleted: false };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setSetupCompleted]);

  return {
    isAuthenticated,
    isSetupCompleted,
    isLoading,
    error,
    setup,
    signIn,
    checkStatus,
    logout,
  };
}
