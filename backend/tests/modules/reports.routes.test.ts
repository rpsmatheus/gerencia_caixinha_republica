import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { expenseRepoMock, monthlyBalanceRepoMock, residentRepoMock } = vi.hoisted(() => ({
  expenseRepoMock: { findAll: vi.fn() },
  monthlyBalanceRepoMock: { findByMonth: vi.fn() },
  residentRepoMock: { findAll: vi.fn() },
}));

vi.mock('../../src/repositories/ExpenseRepository.js', () => ({
  ExpenseRepository: vi.fn().mockImplementation(() => expenseRepoMock),
}));
vi.mock('../../src/repositories/MonthlyBalanceRepository.js', () => ({
  MonthlyBalanceRepository: vi.fn().mockImplementation(() => monthlyBalanceRepoMock),
}));
vi.mock('../../src/repositories/ResidentRepository.js', () => ({
  ResidentRepository: vi.fn().mockImplementation(() => residentRepoMock),
}));

const { createApp } = await import('../../src/app/createApp.js');

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/reports/monthly', () => {
  it('exige year e month', async () => {
    const res = await request(app).get('/api/reports/monthly');
    expect(res.status).toBe(400);
  });

  it('monta o relatório consolidado do mês', async () => {
    expenseRepoMock.findAll.mockResolvedValue({
      data: [
        { amount: 100, category: 'Moradia' },
        { amount: 50, category: 'Alimentação' },
      ],
      total: 2,
    });
    monthlyBalanceRepoMock.findByMonth.mockResolvedValue([
      { amountPaid: 100, currentBalance: 0 },
      { amountPaid: 0, currentBalance: 75 },
    ]);
    residentRepoMock.findAll.mockResolvedValue({
      data: [{ isActive: true }, { isActive: true }, { isActive: false }],
      total: 3,
    });

    const res = await request(app).get('/api/reports/monthly?year=2026&month=6');

    expect(res.status).toBe(200);
    expect(res.body.data.expenses.total).toBe(150);
    expect(res.body.data.expenses.count).toBe(2);
    expect(res.body.data.expenses.byCategory).toEqual({ Moradia: 100, Alimentação: 50 });
    expect(res.body.data.balances.totalCollected).toBe(100);
    expect(res.body.data.balances.totalPending).toBe(75);
    expect(res.body.data.balances.paidCount).toBe(1);
    expect(res.body.data.balances.pendingCount).toBe(1);
    expect(res.body.data.balances.adimplencyRate).toBe(50);
    expect(res.body.data.activeResidentCount).toBe(2);
    expect(res.body.data.monthKey).toBe('2026-06');
  });

  it('retorna taxa de adimplência 0 quando não há moradores ativos', async () => {
    expenseRepoMock.findAll.mockResolvedValue({ data: [], total: 0 });
    monthlyBalanceRepoMock.findByMonth.mockResolvedValue([]);
    residentRepoMock.findAll.mockResolvedValue({ data: [], total: 0 });

    const res = await request(app).get('/api/reports/monthly?year=2026&month=6');

    expect(res.status).toBe(200);
    expect(res.body.data.balances.adimplencyRate).toBe(0);
  });
});
