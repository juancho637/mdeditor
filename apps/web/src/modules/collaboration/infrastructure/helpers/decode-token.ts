interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!));
    return {
      sub: payload.sub,
      name: payload.name || payload.email?.split('@')[0] || 'Unknown',
      email: payload.email,
      isAdmin: payload.isAdmin ?? false,
    };
  } catch {
    return null;
  }
}
