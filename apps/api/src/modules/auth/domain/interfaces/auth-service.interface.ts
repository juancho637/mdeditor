import { SignInType } from '../types/sign-in.type';
import { TokenPayloadType } from '../types/token-payload.type';

export interface AuthServiceInterface {
  generateTokens(payload: TokenPayloadType): Promise<SignInType>;
}
