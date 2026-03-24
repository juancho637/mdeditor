import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepositoryInterface } from '@modules/users/domain';
import {
  AuthServiceInterface,
  TokenRevocationRepositoryInterface,
  authErrorsCodes,
  SignInType,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class RefreshTokenUseCase {
  private readonly context = RefreshTokenUseCase.name;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepositoryInterface,
    private readonly authService: AuthServiceInterface,
    private readonly exception: ExceptionServiceInterface,
    private readonly configService: ConfigService,
    private readonly tokenRevocation: TokenRevocationRepositoryInterface,
  ) {}

  async run(refreshToken: string): Promise<SignInType> {
    let payload: { sub: string; email: string; isAdmin: boolean; typ?: string; exp?: number };

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

    // Check if token has been revoked
    const tokenHash = hashToken(refreshToken);
    const isRevoked = await this.tokenRevocation.isRevoked(tokenHash);
    if (isRevoked) {
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

    // Revoke the old refresh token (rotation + revocation)
    const remainingTtl = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 7 * 24 * 60 * 60;
    if (remainingTtl > 0) {
      await this.tokenRevocation.revoke(tokenHash, remainingTtl);
    }

    return this.authService.generateTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }
}
