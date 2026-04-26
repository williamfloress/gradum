/**
 * Casos límite S6-2 (guía §4.2 opcional): 0 %, 100 % exacto, rechazo > 100.
 */
import {
  excedeCienPorCiento,
  nuevaSumaTrasAnadir,
  nuevaSumaTrasEditar,
  round2Porcentaje,
  toPorcentajeNumber,
} from './planes-evaluacion-porcentajes.util';

describe('planes-evaluacion-porcentajes.util (S6-2)', () => {
  it('nuevaSumaTrasAnadir: 0 + 0 = 0 y no excede', () => {
    expect(nuevaSumaTrasAnadir(0, 0)).toBe(0);
    expect(excedeCienPorCiento(nuevaSumaTrasAnadir(0, 0))).toBe(false);
  });

  it('nuevaSumaTrasAnadir: acumulado 100 exacto permitido', () => {
    expect(nuevaSumaTrasAnadir(60, 40)).toBe(100);
    expect(excedeCienPorCiento(100)).toBe(false);
  });

  it('nuevaSumaTrasAnadir: 100.01 rechazado', () => {
    const s = nuevaSumaTrasAnadir(50, 50.01);
    expect(excedeCienPorCiento(s)).toBe(true);
  });

  it('nuevaSumaTrasEditar: resta aporte anterior y suma el nuevo', () => {
    expect(nuevaSumaTrasEditar(80, 30, 20)).toBe(70);
    expect(excedeCienPorCiento(nuevaSumaTrasEditar(80, 30, 50))).toBe(false);
    expect(excedeCienPorCiento(nuevaSumaTrasEditar(80, 30, 51))).toBe(true);
  });

  it('toPorcentajeNumber acepta objetos tipo Decimal', () => {
    expect(toPorcentajeNumber({ toString: () => '33.33' })).toBeCloseTo(33.33, 2);
  });

  it('round2Porcentaje', () => {
    expect(round2Porcentaje(33.333)).toBe(33.33);
  });
});
