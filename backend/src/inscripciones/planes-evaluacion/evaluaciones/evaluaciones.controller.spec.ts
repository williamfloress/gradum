/**
 * Controlador con guardas desactivadas y servicio mock.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionesController } from './evaluaciones.controller';
import { EvaluacionesService } from './evaluaciones.service';
import { SupabaseAuthGuard } from '../../../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../../../auth/approved-user.guard';

describe('EvaluacionesController', () => {
  let controller: EvaluacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluacionesController],
      providers: [
        {
          provide: EvaluacionesService,
          useValue: {
            findAllByPlan: jest.fn(),
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

    controller = module.get<EvaluacionesController>(EvaluacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
