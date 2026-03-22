'use client';

import { useCallback } from 'react';
import { useAuthStore } from '../state';
import { authRepository } from '../repositories';
import { SetupRequest, SignInRequest } from '../../domain';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    if (axiosErr.response?.status === 429) {
      return 'Too Many Requests';
    }
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

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
        setError(extractErrorMessage(err, 'Error al crear la cuenta'));
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
        setError(extractErrorMessage(err, 'Credenciales inválidas'));
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
