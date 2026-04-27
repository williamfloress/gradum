import { Test, TestingModule } from '@nestjs/testing';
import { InscripcionesService } from './inscripciones.service';

describe('InscripcionesService', () => {
  let service: InscripcionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InscripcionesService],
    }).compile();

    service = module.get<InscripcionesService>(InscripcionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
