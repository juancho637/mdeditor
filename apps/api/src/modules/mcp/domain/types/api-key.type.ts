export type ApiKeyType = {
  id: string;
  userId: string;
  keyHash: string;
  prefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
};
