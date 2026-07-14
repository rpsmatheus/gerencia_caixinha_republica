import { describe, it, expect } from 'vitest';
import { PaymentFactory } from '../../src/factories/PaymentFactory.js';
import { ICreatePaymentDTO } from '../../src/models/Payment.js';

function validDTO(overrides: Partial<ICreatePaymentDTO> = {}): ICreatePaymentDTO {
  return {
    residentId: 'resident-1',
    month: '2026-06',
    amount: 100,
    ...overrides,
  };
}

describe('PaymentFactory.create', () => {
  it('cria um pagamento válido com id gerado', () => {
    const payment = PaymentFactory.create(validDTO());

    expect(payment.id).toBeTruthy();
    expect(payment.residentId).toBe('resident-1');
    expect(payment.month).toBe('2026-06');
    expect(payment.amount).toBe(100);
    expect(payment.createdAt).toBeInstanceOf(Date);
  });

  it('gera ids diferentes a cada criação', () => {
    const a = PaymentFactory.create(validDTO());
    const b = PaymentFactory.create(validDTO());
    expect(a.id).not.toBe(b.id);
  });

  it('lança erro quando residentId está ausente', () => {
    expect(() => PaymentFactory.create(validDTO({ residentId: '' }))).toThrow(
      'residentId obrigatório'
    );
  });

  it('lança erro quando residentId contém apenas espaços', () => {
    expect(() => PaymentFactory.create(validDTO({ residentId: '   ' }))).toThrow(
      'residentId obrigatório'
    );
  });

  it('lança erro quando amount é zero ou negativo', () => {
    expect(() => PaymentFactory.create(validDTO({ amount: 0 }))).toThrow('amount inválido');
    expect(() => PaymentFactory.create(validDTO({ amount: -50 }))).toThrow('amount inválido');
  });

  it('lança erro quando month não está no formato YYYY-MM', () => {
    expect(() => PaymentFactory.create(validDTO({ month: '2026/06' }))).toThrow(
      'month deve ser YYYY-MM'
    );
    expect(() => PaymentFactory.create(validDTO({ month: '26-06' }))).toThrow(
      'month deve ser YYYY-MM'
    );
    expect(() => PaymentFactory.create(validDTO({ month: '' }))).toThrow('month deve ser YYYY-MM');
  });
});
