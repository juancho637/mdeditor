import { AuthenticatedUserType } from './authenticated-user.type';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: AuthenticatedUserType;
    }
  }
}
