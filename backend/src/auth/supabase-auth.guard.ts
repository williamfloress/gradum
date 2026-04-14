import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Guard que verifica el token usando el propio cliente de Supabase.
 * Esto evita tener que replicar la lógica de verificación JWT localmente.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    // Supabase verifica la firma y expiración del token
    const {
      data: { user },
      error,
    } = await this.supabase.client.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Verificar estado en nuestra DB
    const dbUser = await this.prisma.usuario.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw new UnauthorizedException('Usuario no encontrado en la base de datos');
    }

    if (dbUser.estado === 'baneado') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida');
    }

    // pendiente_aprobacion / rechazado: JWT válido pero sin acceso a recursos
    // protegidos por ApprovedUserGuard (excepto rutas que solo usen este guard).

    request.user = {
      userId: dbUser.id,
      email: dbUser.email,
      rol: dbUser.rol,
      nombre: dbUser.nombre,
      estado: dbUser.estado,
    };

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader: string | undefined = request.headers?.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
