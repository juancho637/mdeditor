import { UserType } from '../types/user.type';
import { UserWithPasswordType } from '../types/user-with-password.type';

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<UserType | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPasswordType | null>;
  findById(id: string): Promise<UserType | null>;
  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  }): Promise<UserType>;
  count(): Promise<number>;
}
