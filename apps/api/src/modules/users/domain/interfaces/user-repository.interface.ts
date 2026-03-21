import { UserType } from '../types/user.type';

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<UserType | null>;
  findById(id: string): Promise<UserType | null>;
  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  }): Promise<UserType>;
  count(): Promise<number>;
}
