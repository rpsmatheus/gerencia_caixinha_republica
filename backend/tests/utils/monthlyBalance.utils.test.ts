import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyShare,
  toMonthKey,
  daysInMonth,
  computeProportionalFactor,
} from '../../src/modules/monthly-balance/monthlyBalance.utils.js';
import { IExpense } from '../../src/models/Expense.js';

function makeExpense(amount: number): IExpense {
  return {
    userId: 'user-1',
    republicId: 'republic-1',
    description: 'despesa teste',
    category: 'Outros',
    amount,
    expenseDate: new Date('2026-06-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('calculateMonthlyShare', () => {
  it('divide o total das despesas pelo peso proporcional total', () => {
    const expenses = [makeExpense(100), makeExpense(200)];
    expect(calculateMonthlyShare(expenses, 3)).toBe(100);
  });

  it('retorna 0 quando não há despesas', () => {
    expect(calculateMonthlyShare([], 4)).toBe(0);
  });

  it('retorna 0 quando o peso proporcional total é 0', () => {
    const expenses = [makeExpense(100)];
    expect(calculateMonthlyShare(expenses, 0)).toBe(0);
  });

  it('retorna 0 quando o peso proporcional total é negativo', () => {
    const expenses = [makeExpense(100)];
    expect(calculateMonthlyShare(expenses, -1)).toBe(0);
  });

  it('lida com peso fracionário (morador com saída no meio do mês)', () => {
    const expenses = [makeExpense(150)];
    expect(calculateMonthlyShare(expenses, 1.5)).toBe(100);
  });
});

describe('toMonthKey', () => {
  it('formata mês com um dígito com zero à esquerda', () => {
    expect(toMonthKey(2026, 6)).toBe('2026-06');
  });

  it('formata mês com dois dígitos sem alteração', () => {
    expect(toMonthKey(2026, 12)).toBe('2026-12');
  });

  it('formata janeiro corretamente', () => {
    expect(toMonthKey(2025, 1)).toBe('2025-01');
  });
});

describe('daysInMonth', () => {
  it('retorna 30 dias para junho', () => {
    expect(daysInMonth(2026, 6)).toBe(30);
  });

  it('retorna 31 dias para janeiro', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
  });

  it('retorna 29 dias para fevereiro em ano bissexto', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  it('retorna 28 dias para fevereiro em ano não bissexto', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
  });
});

describe('computeProportionalFactor', () => {
  it('retorna 1 quando exitDay é nulo (mês inteiro)', () => {
    expect(computeProportionalFactor(null, 30)).toBe(1);
  });

  it('retorna 1 quando exitDay é indefinido', () => {
    expect(computeProportionalFactor(undefined, 30)).toBe(1);
  });

  it('retorna 1 quando exitDay é 0 ou negativo', () => {
    expect(computeProportionalFactor(0, 30)).toBe(1);
    expect(computeProportionalFactor(-5, 30)).toBe(1);
  });

  it('calcula a fração proporcional quando o morador saiu no meio do mês', () => {
    expect(computeProportionalFactor(15, 30)).toBe(0.5);
  });

  it('não ultrapassa 1 quando exitDay é maior que o total de dias do mês', () => {
    expect(computeProportionalFactor(45, 30)).toBe(1);
  });
});
