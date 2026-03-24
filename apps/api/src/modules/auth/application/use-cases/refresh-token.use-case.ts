import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepositoryInterface } from '@modules/users/domain';
import { AuthServiceInterface, authErrorsCodes, SignInType } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class RefreshTokenUseCase {
  private readonly context = RefreshTokenUseCase.name;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepositoryInterface,
    private readonly authService: AuthServiceInterface,
    private readonly exception: ExceptionServiceInterface,
    private readonly configService: ConfigService,
  ) {}

  async run(refreshToken: string): Promise<SignInType> {
    let payload: { sub: string; email: string; isAdmin: boolean; typ?: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw this.exception.unauthorizedException({
        message: authErrorsCodes.AUT002,
        context: this.context,
      });
    }

    if (!payload.sub || !payload.email || payload.typ !== 'refresh') {
      throw this.exception.unauthorizedException({
        message: authErrorsCodes.AUT002,
        context: this.context,
      });
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw this.exception.unauthorizedException({
        message: authErrorsCodes.AUT002,
        context: this.context,
      });
    }

    return this.authService.generateTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }
}
