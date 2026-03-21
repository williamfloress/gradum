import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guardia encargado de proteger rutas.
 * Aplica la 'JwtStrategy' para verificar que el usuario esté autenticado.
 * Uso: @UseGuards(JwtAuthGuard) sobre controladores o métodos.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
