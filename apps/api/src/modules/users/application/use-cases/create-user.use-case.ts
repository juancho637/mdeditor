import * as bcrypt from 'bcrypt';
import { UserRepositoryInterface, usersErrorsCodes, CreateUserType, UserType } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class CreateUserUseCase {
  private readonly context = CreateUserUseCase.name;

  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: CreateUserType): Promise<UserType> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw this.exception.badRequestException({
        message: usersErrorsCodes.USR002,
        context: this.context,
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      isAdmin: data.isAdmin,
    });
  }
}
