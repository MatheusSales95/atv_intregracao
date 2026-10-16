import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatarCpf, normalizarCpf, validarCpf } from '../../src/dominio/cpf.js';

describe('validarCpf', () => {
  it('aceita um CPF válido sem máscara', () => {
    assert.equal(validarCpf('52998224725'), true);
  });

  it('aceita um CPF válido com máscara', () => {
    assert.equal(validarCpf('529.982.247-25'), true);
  });

  it('aceita CPF cujo primeiro dígito verificador vira zero (resto 10)', () => {
    assert.equal(validarCpf('123.456.789-09'), true);
  });

  it('aceita CPF cujo segundo dígito verificador vira zero (resto 10)', () => {
    assert.equal(validarCpf('987.654.321-00'), true);
  });

  it('aceita CPF que começa com zeros', () => {
    assert.equal(validarCpf('000.000.001-91'), true);
  });

  it('rejeita CPF com o primeiro dígito verificador errado', () => {
    assert.equal(validarCpf('529.982.247-35'), false);
  });

  it('rejeita CPF com o segundo dígito verificador errado', () => {
    assert.equal(validarCpf('529.982.247-24'), false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    for (let digito = 0; digito <= 9; digito++) {
      assert.equal(validarCpf(String(digito).repeat(11)), false, `${digito} repetido`);
    }
  });

  it('rejeita CPF com menos ou mais de 11 dígitos', () => {
    assert.equal(validarCpf('5299822472'), false);
    assert.equal(validarCpf('529982247255'), false);
  });

  it('rejeita CPF com letras ou outros símbolos', () => {
    assert.equal(validarCpf('529.982.247-2a5'), false);
    assert.equal(validarCpf('529/982/247-25'), false);
  });

  it('rejeita valores que não são texto', () => {
    for (const valor of [undefined, null, 52998224725, {}, []]) {
      assert.equal(validarCpf(valor), false, `valor: ${JSON.stringify(valor)}`);
    }
  });

  it('rejeita texto vazio', () => {
    assert.equal(validarCpf(''), false);
  });
});

describe('normalizarCpf', () => {
  it('remove pontos, hífen e espaços', () => {
    assert.equal(normalizarCpf(' 529.982.247-25 '), '52998224725');
  });

  it('devolve texto vazio para valores ausentes', () => {
    assert.equal(normalizarCpf(undefined), '');
    assert.equal(normalizarCpf(null), '');
  });
});

describe('formatarCpf', () => {
  it('aplica a máscara 000.000.000-00', () => {
    assert.equal(formatarCpf('52998224725'), '529.982.247-25');
  });

  it('mantém a máscara de um CPF já formatado', () => {
    assert.equal(formatarCpf('529.982.247-25'), '529.982.247-25');
  });

  it('devolve só os dígitos quando não há 11 dígitos', () => {
    assert.equal(formatarCpf('123.45'), '12345');
  });
});
