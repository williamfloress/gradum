import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePensumDto } from './dto/create-pensum.dto';
import { UpdatePensumDto } from './dto/update-pensum.dto';

@Injectable()
export class PensumService {
  constructor(private readonly prisma: PrismaService) {}

  private mapPensum(p: any) {
    return {
      id: p.id,
      name: p.nombre,
      version: p.version,
      degreeId: p.carreraId,
      isCurrent: p.vigente,
      createdAt: p.creadoEn,
    };
  }

  async findAllByDegree(degreeId: string) {
    const degree = await this.prisma.degree.findUnique({ where: { id: degreeId } });
    if (!degree) throw new NotFoundException('Degree no encontrado');

    const rows = await this.prisma.pensum.findMany({
      where: { carreraId: degreeId },
      orderBy: { creadoEn: 'desc' },
    });

    return rows.map((p) => this.mapPensum(p));
  }

  async findOne(id: string) {
    const row = await this.prisma.pensum.findUnique({
      where: { id },
      include: { carrera: true },
    });

    if (!row) throw new NotFoundException(`Pensum con ID ${id} no encontrado`);

    return this.mapPensum(row);
  }

  async create(degreeId: string, dto: CreatePensumDto) {
    const degree = await this.prisma.degree.findUnique({ where: { id: degreeId } });
    if (!degree) throw new NotFoundException('Degree no encontrado');

    if (dto.isCurrent) {
      await this.prisma.pensum.updateMany({
        where: { carreraId: degreeId },
        data: { vigente: false },
      });
    }

    const created = await this.prisma.pensum.create({
      data: {
        nombre: dto.name,
        version: dto.version,
        vigente: dto.isCurrent ?? false,
        carreraId: degreeId,
      },
    });

    return this.mapPensum(created);
  }

  async update(id: string, dto: UpdatePensumDto) {
    const existing = await this.findOne(id);

    if (dto.isCurrent) {
      await this.prisma.pensum.updateMany({
        where: { carreraId: existing.degreeId },
        data: { vigente: false },
      });
    }

    const updated = await this.prisma.pensum.update({
      where: { id },
      data: {
        nombre: dto.name,
        version: dto.version,
        vigente: dto.isCurrent,
      },
    });

    return this.mapPensum(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.pensum.delete({ where: { id } });

    return { message: 'Pensum eliminado correctamente' };
  }
}
