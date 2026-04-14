/**
 * Sprint 3 — Login: emite token para `pendiente_aprobacion` y `rechazado` (no para `baneado`);
 * el front redirige; el resto de la API usa ApprovedUserGuard.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, nombre, password } = registerDto;

    // Supabase maneja el registro y el hashing de la contraseña
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
        },
      },
    });

    if (error || !data.user) {
      if (error?.status === 400 && error?.message.includes('already registered')) {
        throw new ConflictException('El correo ya está registrado en Supabase');
      }
      throw new BadRequestException(error?.message || 'Error al registrar en Supabase');
    }

    // Sincronizar con la tabla usuario de Prisma
    const user = await this.prisma.usuario.upsert({
      where: { email },
      update: { nombre },
      create: {
        id: data.user.id, // Usamos el UUID de Supabase
        email,
        nombre,
        passwordHash: ''
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Autenticar con Supabase
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Credenciales inválidas: ' + (error?.message || 'Error de sesión'));
    }

    // Verificar en nuestra DB el estado del usuario
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado en la base de datos local');
    }

    if (user.estado === 'baneado') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida');
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      estado: user.estado, // expuesto al cliente para rutas /pendiente-aprobacion y /cuenta-denegada
    };

    const allowed: Array<(typeof user)['estado']> = [
      'aprobado',
      'pendiente_aprobacion',
      'rechazado',
    ];
    if (!allowed.includes(user.estado)) {
      throw new UnauthorizedException('No podés acceder con esta cuenta');
    }

    return {
      user: sessionUser,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      estado: user.estado,
    };
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabaseService.client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Sesión expirada, iniciá sesión nuevamente');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }
}
