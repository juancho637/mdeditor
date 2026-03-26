'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InvitationStatus } from '@/modules/invitations/domain/types/invitation-status.enum';
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
import { invitationRepository } from '@/modules/invitations/infrastructure/repositories/invitation-v1.repository';
import { saveAccessToken } from '@/common/helpers/token-storage.utils';

type InviteState = 'loading' | 'pending' | 'accepted' | 'not-found' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [state, setState] = useState<InviteState>('loading');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function checkInvitation() {
      try {
        const invitation = await invitationRepository.getByToken(token);
        setEmail(invitation.email);
        setState(invitation.status === InvitationStatus.PENDING ? 'pending' : 'accepted');
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        setState(status === 404 ? 'not-found' : 'error');
      }
    }
    checkInvitation();
  }, [token]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !password || password.length < 8) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const result = await invitationRepository.acceptInvitation(token, {
          name: name.trim(),
          password,
        });
        saveAccessToken(result.accessToken);
        router.push('/dashboard');
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setSubmitError(axiosErr?.response?.data?.message ?? 'Error al crear la cuenta');
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, name, password, router],
  );

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground-secondary">Cargando...</p>
      </div>
    );
  }

  if (state === 'not-found' || state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-xl font-semibold">Invitación no válida</h1>
        <p className="text-foreground-secondary">Este enlace de invitación no existe o ha expirado.</p>
        <Link href="/sign-in" className="text-primary hover:underline text-sm">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (state === 'accepted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-xl font-semibold">Invitación ya utilizada</h1>
        <p className="text-foreground-secondary">Esta invitación ya fue aceptada.</p>
        <Link href="/sign-in" className="text-primary hover:underline text-sm">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-2xl font-bold mb-2">markdown</h1>
      <p className="text-foreground-secondary mb-8">Completa tu registro para unirte al workspace</p>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Crear tu cuenta</CardTitle>
          <CardDescription>Invitación para {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>

            {submitError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
