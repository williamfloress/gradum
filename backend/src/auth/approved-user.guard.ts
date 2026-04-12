import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Exige que el usuario en BD tenga estado `aprobado`.
 * Usar después de SupabaseAuthGuard en rutas que no deben ser accedidas por
 * cuentas pendientes o rechazadas (solo sesión Supabase válida).
 */
@Injectable()
export class ApprovedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { estado?: string };
    }>();
    const user = request.user;

    if (!user || !('estado' in user)) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (user.estado !== 'aprobado') {
      throw new ForbiddenException('Cuenta no aprobada');
    }

    return true;
  }
}
