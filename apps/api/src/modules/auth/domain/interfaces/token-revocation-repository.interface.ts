export interface TokenRevocationRepositoryInterface {
  revoke(tokenHash: string, ttlSeconds: number): Promise<void>;
  isRevoked(tokenHash: string): Promise<boolean>;
}
