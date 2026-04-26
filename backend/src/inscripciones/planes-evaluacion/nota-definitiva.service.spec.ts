/**
 * Verifica que el recálculo use una transacción y persista estado esperado con datos mock.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotaDefinitivaService } from './nota-definitiva.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotaDefinitivaService', () => {
  it('recalcular: completo y nota ≥ 3 → aprobada', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<void>) => {
        await cb({
          planEvaluacion: {
            findMany: jest.fn().mockResolvedValue([
              { porcentaje: 100, evaluaciones: [{ notaReal: 4 }] },
            ]),
          },
          inscripcionSemestre: { update },
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotaDefinitivaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = module.get(NotaDefinitivaService);
    await service.recalcularNotaDefinitiva('ins-1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'ins-1' },
      data: { notaDefinitiva: 4, estado: 'aprobada' },
    });
  });

  it('recalcular: incompleto → en_curso y nota null', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<void>) => {
        await cb({
          planEvaluacion: {
            findMany: jest.fn().mockResolvedValue([
              { porcentaje: 50, evaluaciones: [{ notaReal: 4 }] },
              { porcentaje: 50, evaluaciones: [{ notaReal: null }] },
            ]),
          },
          inscripcionSemestre: { update },
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotaDefinitivaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    await module.get(NotaDefinitivaService).recalcularNotaDefinitiva('ins-2');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'ins-2' },
      data: { notaDefinitiva: null, estado: 'en_curso' },
    });
  });
});
