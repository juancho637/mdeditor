export type UserWithPasswordType = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};
