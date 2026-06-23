import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthTokenService } from 'src/auth/providers/auth-token.service';
import type { AuthenticatedUser } from 'src/auth/interfaces/request-with-user';
import { Role } from '../../enums/role.enum';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;
    if (!token) throw new UnauthorizedException('No token provided');
    try {
      const payload = await this.authTokenService.verifyAccessToken(token);
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as Role,
      };
      (client as any).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
