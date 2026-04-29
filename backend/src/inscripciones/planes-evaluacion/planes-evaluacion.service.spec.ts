/**
 * Prueba mínima de arranque del servicio; la lógica fina irá con mocks de Prisma en iteraciones siguientes.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PlanesEvaluacionService } from './planes-evaluacion.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotaDefinitivaService } from './nota-definitiva.service';

describe('PlanesEvaluacionService', () => {
  let service: PlanesEvaluacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanesEvaluacionService,
        { provide: NotaDefinitivaService, useValue: { recalcularNotaDefinitiva: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            inscripcionSemestre: { findUnique: jest.fn() },
            planEvaluacion: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { porcentaje: 0 } }),
              findMany: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PlanesEvaluacionService>(PlanesEvaluacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
