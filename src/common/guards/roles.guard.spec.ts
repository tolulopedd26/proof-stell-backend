import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

const buildContext = (user: unknown, requiredRoles?: Role[]): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(buildContext({ role: Role.PLAYER }))).toBe(true);
  });

  it('allows a PLAYER to access a player route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    expect(guard.canActivate(buildContext({ role: Role.PLAYER }))).toBe(true);
  });

  it('allows an ADMIN to access a player+admin route', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.PLAYER, Role.ADMIN]);
    expect(guard.canActivate(buildContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('denies a PLAYER from an admin-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(buildContext({ role: Role.PLAYER }))).toBe(false);
  });

  it('uses exact enum comparison — does not grant access on partial string match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    // 'admin-extra' must NOT match Role.ADMIN ('admin')
    expect(guard.canActivate(buildContext({ role: 'admin-extra' }))).toBe(
      false,
    );
  });
});
