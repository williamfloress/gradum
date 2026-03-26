import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

export type JwtRequestUser = {
  userId: string;
  email: string;
  rol: Rol;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    const user = request.user;

    if (!user?.rol) {
      throw new ForbiddenException('No se pudo determinar el rol del usuario');
    }

    if (!requiredRoles.includes(user.rol)) {
      throw new ForbiddenException('No tienes permiso para acceder a este recurso');
    }

    return true;
  }
}
