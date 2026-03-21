import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Estrategia de Passport para validar tokens JWT.
 * Configura cómo se extrae el token del Header y cómo se valida.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      // Extrae el token del encabezado 'Authorization: Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  /**
   * Método de validación interna de Passport.
   * Si el token es válido, Passport llama a este método con el payload decodificado.
   * Lo que retornamos aquí será inyectado en el objeto 'Request' como 'req.user'.
   */
  async validate(payload: any) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o token inválido');
    }

    // Retornamos los datos básicos que queremos tener disponibles en los controladores protegidos
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}
