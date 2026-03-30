import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthServiceInterface,
  SignInType,
  TokenPayloadType,
} from '../../domain';

export class AuthService implements AuthServiceInterface {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(payload: TokenPayloadType): Promise<SignInType> {
    const basePayload = {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      isAdmin: payload.isAdmin,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, typ: 'access' },
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          expiresIn: this.configService.getOrThrow('JWT_EXPIRATION') as never,
        },
      ),
      this.jwtService.signAsync(
        { ...basePayload, typ: 'refresh' },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.getOrThrow(
            'JWT_REFRESH_EXPIRATION',
          ) as never,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
