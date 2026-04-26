/**
 * Casos guía §6.3: dos planes 40 % / 60 % con notas 4.0 y 5.0 → 4.6; incompletos y 0 %.
 */
import { computeDefinitivaYCompleto } from './nota-definitiva.util';

describe('nota-definitiva.util (S6-4)', () => {
  it('40 % a 4.0 y 60 % a 5.0 → 4.6', () => {
    const r = computeDefinitivaYCompleto([
      { porcentaje: 40, notasReales: [4] },
      { porcentaje: 60, notasReales: [5] },
    ]);
    expect(r.completo).toBe(true);
    expect(r.nota).toBeCloseTo(4.6, 5);
  });

  it('dos evaluaciones en un plan: promedio × peso', () => {
    const r = computeDefinitivaYCompleto([{ porcentaje: 100, notasReales: [4, 5] }]);
    expect(r.completo).toBe(true);
    expect(r.nota).toBe(4.5);
  });

  it('incompleto si un plan con peso no tiene ninguna nota real', () => {
    const r = computeDefinitivaYCompleto([
      { porcentaje: 50, notasReales: [4] },
      { porcentaje: 50, notasReales: [null] },
    ]);
    expect(r.completo).toBe(false);
    expect(r.nota).toBeNull();
  });

  it('plan 0 % no exige nota; solo cuenta el plan con peso', () => {
    const r = computeDefinitivaYCompleto([
      { porcentaje: 0, notasReales: [] },
      { porcentaje: 100, notasReales: [3] },
    ]);
    expect(r.completo).toBe(true);
    expect(r.nota).toBe(3);
  });

  it('sin planes con peso > 0 → incompleto', () => {
    expect(computeDefinitivaYCompleto([]).completo).toBe(false);
    expect(computeDefinitivaYCompleto([{ porcentaje: 0, notasReales: [5] }]).completo).toBe(false);
  });
});
