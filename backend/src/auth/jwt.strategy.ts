import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Estrategia de Passport para validar tokens JWT.
 * Configura cómo se extrae el token del Header y cómo se valida.
 */
/**
 * El JWT secret de Supabase se muestra en el dashboard en Base64.
 * passport-jwt necesita el buffer de bytes raw para verificar correctamente.
 */
function getJwtSecret(): Buffer | string {
  const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
  if (supabaseSecret) {
    try {
      return Buffer.from(supabaseSecret, 'base64');
    } catch {
      return supabaseSecret;
    }
  }
  return process.env.JWT_SECRET || 'fallback-secret-change-me';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      // Extrae el token del encabezado 'Authorization: Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Decodificamos el secret de Base64 ya que Supabase lo muestra así en su dashboard.
      // Project Settings → API → JWT Settings → JWT Secret
      secretOrKey: getJwtSecret(),
    });
  }

  /**
   * Método de validación interna de Passport.
   * Si el token es válido, Passport llama a este método con el payload decodificado.
   * Lo que retornamos aquí será inyectado en el objeto 'Request' como 'req.user'.
   */
  async validate(payload: any) {
    // DEBUG TEMPORAL - eliminar en producción
    console.log('[JWT] payload.sub:', payload.sub);
    console.log('[JWT] payload.email:', payload.email);

    // En Supabase, el ID del usuario está en 'sub'
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    console.log('[JWT] usuario en DB:', user ? `${user.email} (estado: ${user.estado})` : 'NO ENCONTRADO');

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o token inválido');
    }

    if (user.estado === 'baneado') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida');
    }

    if (user.estado !== 'aprobado') {
      throw new UnauthorizedException('Cuenta no activa o sesión revocada');
    }

    // Retornamos los datos básicos vinculados a nuestro usuario en DB
    return { userId: user.id, email: user.email, rol: user.rol, nombre: user.nombre };
  }
}
