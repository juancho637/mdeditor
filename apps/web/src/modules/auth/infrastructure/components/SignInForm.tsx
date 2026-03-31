'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { useAuthViewModel } from '../hooks';

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'El email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida';
  return null;
}

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps = {}) {
  const router = useRouter();
  const { signIn, isLoading, error } = useAuthViewModel();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  const handleBlur = useCallback(
    (field: 'email' | 'password') => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const value = field === 'email' ? email : password;
      const validator = field === 'email' ? validateEmail : validatePassword;
      const error = validator(value);
      setFieldErrors((prev) => ({ ...prev, [field]: error ?? undefined }));
    },
    [email, password],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);
      setTouched({ email: true, password: true });
      setFieldErrors({
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
      });

      if (emailError || passwordError) return;

      const success = await signIn({
        email: email.trim(),
        password,
      });
      if (success) {
        const safeRedirect = redirectTo?.startsWith('/')
          ? redirectTo
          : '/dashboard';
        router.push(safeRedirect);
      }
    },
    [email, password, signIn, router],
  );

  const isRateLimited =
    error?.includes('ThrottlerException') ||
    error?.includes('Too Many') ||
    error?.includes('rate');
  const displayError = isRateLimited
    ? 'Demasiados intentos. Espera un momento antes de volver a intentar.'
    : error;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold">Iniciar sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              autoComplete="email"
              disabled={isLoading}
              className={
                touched.email && fieldErrors.email ? 'border-destructive' : ''
              }
            />
            {touched.email && fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              autoComplete="current-password"
              disabled={isLoading}
              className={
                touched.password && fieldErrors.password
                  ? 'border-destructive'
                  : ''
              }
            />
            {touched.password && fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {displayError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {displayError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
