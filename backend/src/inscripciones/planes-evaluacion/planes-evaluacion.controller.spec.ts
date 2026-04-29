/**
 * Prueba de arranque del controlador con servicio simulado (sin HTTP real).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PlanesEvaluacionController } from './planes-evaluacion.controller';
import { PlanesEvaluacionService } from './planes-evaluacion.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../../auth/approved-user.guard';

describe('PlanesEvaluacionController', () => {
  let controller: PlanesEvaluacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanesEvaluacionController],
      providers: [
        {
          provide: PlanesEvaluacionService,
          useValue: {
            findAllByInscripcion: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApprovedUserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlanesEvaluacionController>(PlanesEvaluacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
