import { decodeTokenPayload } from '../decode-token';

function encodePayload(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('decodeTokenPayload', () => {
  it('should decode a valid JWT payload with name', () => {
    const token = encodePayload({ sub: 'uid-1', name: 'Carlos', email: 'carlos@test.com', isAdmin: true });
    const result = decodeTokenPayload(token);
    expect(result).toEqual({
      sub: 'uid-1',
      name: 'Carlos',
      email: 'carlos@test.com',
      isAdmin: true,
    });
  });

  it('should fallback to email prefix when name is missing', () => {
    const token = encodePayload({ sub: 'uid-1', email: 'valentina@test.com', isAdmin: false });
    const result = decodeTokenPayload(token);
    expect(result?.name).toBe('valentina');
  });

  it('should return null for invalid token', () => {
    expect(decodeTokenPayload('not-a-token')).toBeNull();
    expect(decodeTokenPayload('')).toBeNull();
  });
});
