import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDegreeDto } from './dto/create-degree.dto';
import { UpdateDegreeDto } from './dto/update-degree.dto';

@Injectable()
export class DegreeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.degree.findMany({
      orderBy: { nombre: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.nombre,
      code: r.codigo,
      active: r.activa,
      createdAt: r.creadoEn,
    }));
  }

  async findOne(id: string) {
    const degree = await this.prisma.degree.findUnique({
      where: { id },
    });

    if (!degree) {
      throw new NotFoundException(`Degree con ID ${id} no encontrado`);
    }

    return {
      id: degree.id,
      name: degree.nombre,
      code: degree.codigo,
      active: degree.activa,
      createdAt: degree.creadoEn,
    };
  }

  async create(dto: CreateDegreeDto) {
    const created = await this.prisma.degree.create({
      data: {
        nombre: dto.name,
        codigo: dto.code,
        activa: true,
      },
    });

    return {
      id: created.id,
      name: created.nombre,
      code: created.codigo,
      active: created.activa,
      createdAt: created.creadoEn,
    };
  }

  async update(id: string, dto: UpdateDegreeDto) {
    // Verificamos existencia
    await this.findOne(id);

    const updated = await this.prisma.degree.update({
      where: { id },
      data: {
        nombre: dto.name,
        codigo: dto.code,
        activa: dto.active,
      },
    });

    return {
      id: updated.id,
      name: updated.nombre,
      code: updated.codigo,
      active: updated.activa,
      createdAt: updated.creadoEn,
    };
  }

  async remove(id: string) {
    // Verificamos existencia primero
    await this.findOne(id);

    const deleted = await this.prisma.degree.delete({
      where: { id },
    });

    return {
      id: deleted.id,
      name: deleted.nombre,
      code: deleted.codigo,
      active: deleted.activa,
      createdAt: deleted.creadoEn,
    };
  }
}
