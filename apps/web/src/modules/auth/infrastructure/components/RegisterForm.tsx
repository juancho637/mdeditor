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

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const { setup, isLoading, error } = useAuthViewModel();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return 'El nombre es obligatorio';
    if (value.trim().length < 2)
      return 'El nombre debe tener al menos 2 caracteres';
    return undefined;
  }, []);

  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value.trim()) return 'El email es obligatorio';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Ingresa un email válido';
    return undefined;
  }, []);

  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return 'La contraseña es obligatoria';
    if (value.length < 8)
      return 'La contraseña debe tener al menos 8 caracteres';
    return undefined;
  }, []);

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      let error: string | undefined;
      switch (field) {
        case 'name':
          error = validateName(name);
          break;
        case 'email':
          error = validateEmail(email);
          break;
        case 'password':
          error = validatePassword(password);
          break;
      }
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    },
    [name, email, password, validateName, validateEmail, validatePassword],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const errors: FieldErrors = {
        name: validateName(name),
        email: validateEmail(email),
        password: validatePassword(password),
      };
      setFieldErrors(errors);
      setTouched({ name: true, email: true, password: true });

      if (errors.name || errors.email || errors.password) return;

      const success = await setup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (success) {
        router.push('/dashboard');
      }
    },
    [
      name,
      email,
      password,
      setup,
      router,
      validateName,
      validateEmail,
      validatePassword,
    ],
  );

  const passwordStrength =
    password.length >= 8 ? 'strong' : password.length >= 4 ? 'medium' : 'weak';

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold">
          Configuración inicial
        </CardTitle>
        <CardDescription>
          Crea tu cuenta de administrador para comenzar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              aria-invalid={touched.name && !!fieldErrors.name}
              autoComplete="name"
            />
            {touched.name && fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              aria-invalid={touched.email && !!fieldErrors.email}
              autoComplete="email"
            />
            {touched.email && fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-invalid={touched.password && !!fieldErrors.password}
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="flex gap-1 mt-1">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength === 'weak'
                      ? 'bg-destructive'
                      : passwordStrength === 'medium'
                        ? 'bg-warning'
                        : 'bg-success'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength === 'medium'
                      ? 'bg-warning'
                      : passwordStrength === 'strong'
                        ? 'bg-success'
                        : 'bg-muted'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength === 'strong' ? 'bg-success' : 'bg-muted'
                  }`}
                />
              </div>
            )}
            {touched.password && fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta de administrador'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
