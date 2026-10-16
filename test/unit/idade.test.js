import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcularIdade, compararDatas, interpretarData } from '../../src/dominio/idade.js';

// new Date(ano, mêsBaseZero, dia) usa o fuso local, igual ao cálculo da idade.
const em = (ano, mes, dia) => new Date(ano, mes - 1, dia);

describe('calcularIdade', () => {
  it('conta o ano quando o aniversário já passou', () => {
    assert.equal(calcularIdade('2000-03-10', em(2026, 10, 16)), 26);
  });

  it('conta o ano no próprio dia do aniversário', () => {
    assert.equal(calcularIdade('2000-10-16', em(2026, 10, 16)), 26);
  });

  it('não conta o ano na véspera do aniversário', () => {
    assert.equal(calcularIdade('2000-10-17', em(2026, 10, 16)), 25);
  });

  it('não conta o ano quando o aniversário é num mês mais à frente', () => {
    assert.equal(calcularIdade('2000-12-01', em(2026, 10, 16)), 25);
  });

  it('é zero para quem nasceu hoje', () => {
    assert.equal(calcularIdade('2026-10-16', em(2026, 10, 16)), 0);
  });

  it('é zero na véspera do primeiro aniversário', () => {
    assert.equal(calcularIdade('2025-10-17', em(2026, 10, 16)), 0);
  });

  it('quem nasceu em 29/02 ainda não completou ano em 28/02 de ano não bissexto', () => {
    assert.equal(calcularIdade('2000-02-29', em(2025, 2, 28)), 24);
  });

  it('quem nasceu em 29/02 completa ano em 01/03 de ano não bissexto', () => {
    assert.equal(calcularIdade('2000-02-29', em(2025, 3, 1)), 25);
  });

  it('quem nasceu em 29/02 completa ano em 29/02 de ano bissexto', () => {
    assert.equal(calcularIdade('2000-02-29', em(2024, 2, 29)), 24);
  });

  it('lança erro para data de nascimento no futuro', () => {
    assert.throws(() => calcularIdade('2026-10-17', em(2026, 10, 16)), RangeError);
  });

  it('lança erro para data inválida', () => {
    for (const data of ['2023-02-30', '16/10/2000', '', null, undefined]) {
      assert.throws(() => calcularIdade(data, em(2026, 10, 16)), TypeError, `data: ${data}`);
    }
  });

  it('usa a data de hoje quando a referência não é informada', () => {
    const anoPassado = new Date().getFullYear() - 1;
    assert.equal(calcularIdade(`${anoPassado}-01-01`), 1);
  });
});

describe('interpretarData', () => {
  it('lê uma data AAAA-MM-DD', () => {
    assert.deepEqual(interpretarData('1990-05-20'), { ano: 1990, mes: 5, dia: 20 });
  });

  it('aceita 29/02 em ano bissexto', () => {
    assert.deepEqual(interpretarData('2024-02-29'), { ano: 2024, mes: 2, dia: 29 });
  });

  it('rejeita datas que não existem no calendário', () => {
    for (const data of ['2023-02-29', '2023-02-30', '2023-04-31', '2023-13-01', '2023-00-10']) {
      assert.equal(interpretarData(data), null, data);
    }
  });

  it('rejeita outros formatos', () => {
    for (const data of ['20/05/1990', '1990-5-20', '1990-05-20T00:00:00Z', 'ontem', 19900520]) {
      assert.equal(interpretarData(data), null, String(data));
    }
  });
});

describe('compararDatas', () => {
  const data = (ano, mes, dia) => ({ ano, mes, dia });

  it('é zero para datas iguais', () => {
    assert.equal(compararDatas(data(2000, 1, 1), data(2000, 1, 1)), 0);
  });

  it('compara primeiro o ano, depois o mês, depois o dia', () => {
    assert.ok(compararDatas(data(1999, 12, 31), data(2000, 1, 1)) < 0);
    assert.ok(compararDatas(data(2000, 2, 1), data(2000, 1, 31)) > 0);
    assert.ok(compararDatas(data(2000, 1, 2), data(2000, 1, 1)) > 0);
  });
});
