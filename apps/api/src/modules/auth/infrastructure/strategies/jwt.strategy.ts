import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayloadType } from '../../domain';
import { AuthenticatedUserType } from '@common/helpers/domain';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.getOrThrow<string>('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: TokenPayloadType): AuthenticatedUserType {
    return {
      id: payload.sub,
      email: payload.email,
      name: '',
      isAdmin: payload.isAdmin,
    };
  }
}
