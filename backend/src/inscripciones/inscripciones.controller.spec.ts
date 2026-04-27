import { Test, TestingModule } from '@nestjs/testing';
import { InscripcionesController } from './inscripciones.controller';
import { InscripcionesService } from './inscripciones.service';

describe('InscripcionesController', () => {
  let controller: InscripcionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InscripcionesController],
      providers: [InscripcionesService],
    }).compile();

    controller = module.get<InscripcionesController>(InscripcionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
