import { describe, it, expect } from 'vitest';
import { ExpenseFactory } from '../../src/factories/ExpenseFactory.js';
import { ICreateExpenseDTO } from '../../src/models/Expense.js';

const user = { id: 'user-1', republicId: 'republic-1' };

function validDTO(overrides: Partial<ICreateExpenseDTO> = {}): ICreateExpenseDTO {
  return {
    description: 'Conta de luz',
    category: 'Utilidades',
    amount: 150.5,
    expenseDate: new Date('2026-06-10'),
    ...overrides,
  };
}

describe('ExpenseFactory.create', () => {
  it('cria uma despesa válida com os dados do usuário autenticado', () => {
    const expense = ExpenseFactory.create(validDTO(), user);

    expect(expense.userId).toBe(user.id);
    expect(expense.republicId).toBe(user.republicId);
    expect(expense.description).toBe('Conta de luz');
    expect(expense.category).toBe('Utilidades');
    expect(expense.amount).toBe(150.5);
    expect(expense.expenseDate).toEqual(new Date('2026-06-10'));
    expect(expense.proofFileName).toBeUndefined();
    expect(expense.proofOriginalName).toBeUndefined();
    expect(expense.createdAt).toBeInstanceOf(Date);
    expect(expense.updatedAt).toBeInstanceOf(Date);
  });

  it('remove espaços em branco de description e notes', () => {
    const expense = ExpenseFactory.create(
      validDTO({ description: '  Conta de luz  ', notes: '  urgente  ' }),
      user
    );

    expect(expense.description).toBe('Conta de luz');
    expect(expense.notes).toBe('urgente');
  });

  it('lança erro quando description está ausente', () => {
    expect(() => ExpenseFactory.create(validDTO({ description: '' }), user)).toThrow(
      'description obrigatório'
    );
  });

  it('lança erro quando description contém apenas espaços', () => {
    expect(() => ExpenseFactory.create(validDTO({ description: '   ' }), user)).toThrow(
      'description obrigatório'
    );
  });

  it('lança erro quando amount é ausente', () => {
    expect(() =>
      ExpenseFactory.create(validDTO({ amount: undefined as unknown as number }), user)
    ).toThrow('amount inválido');
  });

  it('lança erro quando amount é zero ou negativo', () => {
    expect(() => ExpenseFactory.create(validDTO({ amount: 0 }), user)).toThrow('amount inválido');
    expect(() => ExpenseFactory.create(validDTO({ amount: -10 }), user)).toThrow(
      'amount inválido'
    );
  });

  it('lança erro quando category está ausente', () => {
    expect(() =>
      ExpenseFactory.create(validDTO({ category: '' as unknown as string }), user)
    ).toThrow('category obrigatório');
  });

  it('lança erro quando expenseDate está ausente', () => {
    expect(() =>
      ExpenseFactory.create(validDTO({ expenseDate: undefined as unknown as Date }), user)
    ).toThrow('expenseDate obrigatório');
  });
});
