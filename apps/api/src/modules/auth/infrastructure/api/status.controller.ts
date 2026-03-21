import { Controller, Get, Inject } from '@nestjs/common';
import { UsersProvidersEnum, UserRepositoryInterface } from '@modules/users/domain';

@Controller()
export class StatusController {
  constructor(
    @Inject(UsersProvidersEnum.USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  @Get('api/auth/status')
  async run() {
    const userCount = await this.userRepository.count();
    return { setup_completed: userCount > 0 };
  }
}
