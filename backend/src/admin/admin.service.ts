import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoUsuario, Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminUserAction } from './dto/admin-user-action.dto';

export type AdminUserListItem = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
  fechaRegistro: Date;
  actualizadoEn: Date;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(): Promise<AdminUserListItem[]> {
    const rows = await this.prisma.usuario.findMany({
      orderBy: { fechaRegistro: 'desc' },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        estado: true,
        fechaRegistro: true,
        actualizadoEn: true,
      },
    });
    return rows;
  }

  async applyUserAction(
    adminId: string,
    targetUserId: string,
    accion: AdminUserAction,
  ): Promise<AdminUserListItem> {
    if (targetUserId === adminId) {
      throw new BadRequestException('No puedes aplicar esta acción sobre tu propia cuenta');
    }

    const target = await this.prisma.usuario.findUnique({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (target.rol === 'admin') {
      throw new ForbiddenException('No se pueden modificar cuentas de administrador');
    }

    let nuevoEstado: EstadoUsuario;
    let historialAccion: 'aprobado' | 'rechazado' | 'baneado';

    switch (accion) {
      case 'aprobar':
        if (target.estado !== 'pendiente_aprobacion') {
          throw new BadRequestException(
            'Solo se pueden aprobar registros en estado pendiente',
          );
        }
        nuevoEstado = 'aprobado';
        historialAccion = 'aprobado';
        break;
      case 'denegar':
        if (target.estado !== 'pendiente_aprobacion') {
          throw new BadRequestException(
            'Solo se pueden denegar registros en estado pendiente',
          );
        }
        nuevoEstado = 'rechazado';
        historialAccion = 'rechazado';
        break;
      case 'banear':
        if (target.estado !== 'aprobado') {
          throw new BadRequestException(
            'Solo se pueden suspender cuentas ya aprobadas',
          );
        }
        nuevoEstado = 'baneado';
        historialAccion = 'baneado';
        break;
      default:
        throw new BadRequestException('Acción no válida');
    }

    const updated = await this.prisma.prisma.$transaction(async (tx) => {
      const u = await tx.usuario.update({
        where: { id: targetUserId },
        data: { estado: nuevoEstado },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          estado: true,
          fechaRegistro: true,
          actualizadoEn: true,
        },
      });

      await tx.historialAprobacion.create({
        data: {
          usuarioId: targetUserId,
          adminId,
          accion: historialAccion,
        },
      });

      return u;
    });

    return updated;
  }
}
