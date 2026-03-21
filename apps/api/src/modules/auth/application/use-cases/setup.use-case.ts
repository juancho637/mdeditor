import { UserRepositoryInterface } from '@modules/users/domain';
import { CreateUserUseCase } from '@modules/users/application';
import { AuthServiceInterface, authErrorsCodes, SignInType } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class SetupUseCase {
  private readonly context = SetupUseCase.name;

  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly authService: AuthServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<SignInType> {
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      throw this.exception.badRequestException({
        message: authErrorsCodes.AUT003,
        context: this.context,
      });
    }

    const user = await this.createUserUseCase.run({
      name: data.name,
      email: data.email,
      password: data.password,
      isAdmin: true,
    });

    return this.authService.generateTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }
}
