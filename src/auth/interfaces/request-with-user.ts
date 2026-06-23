import { Request } from 'express';
import { Role } from '../../common/enums/role.enum';

/** Canonical authenticated user shape — used on both HTTP and WebSocket paths. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
