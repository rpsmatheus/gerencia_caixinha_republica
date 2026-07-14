import { IExpense, ICreateExpenseDTO } from '../models/Expense.js';

export class ExpenseFactory {
  static create(data: ICreateExpenseDTO, user: { id: string, republicId: string }): IExpense {
    if (!data.description?.trim()) throw new Error('description obrigatório');
    if (!data.amount || data.amount <= 0) throw new Error('amount inválido');
    if (!data.category) throw new Error('category obrigatório');
    if (!data.expenseDate) throw new Error('expenseDate obrigatório');

    const now = new Date();

    return {
      userId: user.id,
      republicId: user.republicId,

      description: data.description.trim(),
      category: data.category,
      amount: data.amount,
      expenseDate: new Date(data.expenseDate),

      notes: data.notes?.trim(),

      proofUrl: undefined,

      createdAt: now,
      updatedAt: now,
    };
  }
}