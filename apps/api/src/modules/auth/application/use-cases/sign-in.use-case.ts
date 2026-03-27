import * as bcrypt from 'bcrypt';
import { UserRepositoryInterface } from '@modules/users/domain';
import { AuthServiceInterface, authErrorsCodes, SignInType } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

// Pre-hashed dummy to prevent timing attacks when user doesn't exist
const DUMMY_HASH = '$2b$10$dummyHashForTimingAttackPrevention00000000000000000';

export class SignInUseCase {
  private readonly context = SignInUseCase.name;

  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly authService: AuthServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: { email: string; password: string }): Promise<SignInType> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmailWithPassword(normalizedEmail);

    // Always run bcrypt.compare to prevent timing-based email enumeration
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(data.password, hashToCompare);

    if (!user || !isPasswordValid) {
      throw this.exception.badRequestException({
        message: authErrorsCodes.AUT001,
        context: this.context,
      });
    }

    return this.authService.generateTokens({
      sub: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }
}
