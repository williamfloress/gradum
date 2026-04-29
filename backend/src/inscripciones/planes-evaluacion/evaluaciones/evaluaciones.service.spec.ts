/**
 * Smoke test del servicio con Prisma simulado (sin BD).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionesService } from './evaluaciones.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotaDefinitivaService } from '../nota-definitiva.service';

describe('EvaluacionesService', () => {
  let service: EvaluacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluacionesService,
        { provide: NotaDefinitivaService, useValue: { recalcularNotaDefinitiva: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            planEvaluacion: { findFirst: jest.fn() },
            evaluacion: {
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

    service = module.get<EvaluacionesService>(EvaluacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
