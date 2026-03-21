import { UserType } from '../../domain/types/user.type';

export class UserPresenter {
  static toResponse(user: UserType) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.isAdmin,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}
