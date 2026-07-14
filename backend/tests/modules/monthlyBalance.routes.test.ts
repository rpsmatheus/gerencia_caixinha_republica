import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { residentRepoMock, expenseRepoMock, monthlyBalanceRepoMock, paymentRepoMock } = vi.hoisted(() => ({
  residentRepoMock: { findAll: vi.fn() },
  expenseRepoMock: { findAll: vi.fn() },
  monthlyBalanceRepoMock: {
    findByMonth: vi.fn(),
    findByResidentAndMonth: vi.fn(),
    upsert: vi.fn(),
  },
  paymentRepoMock: {
    findByResidentAndMonth: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/repositories/ResidentRepository.js', () => ({
  ResidentRepository: vi.fn().mockImplementation(() => residentRepoMock),
}));
vi.mock('../../src/repositories/ExpenseRepository.js', () => ({
  ExpenseRepository: vi.fn().mockImplementation(() => expenseRepoMock),
}));
vi.mock('../../src/repositories/MonthlyBalanceRepository.js', () => ({
  MonthlyBalanceRepository: vi.fn().mockImplementation(() => monthlyBalanceRepoMock),
}));
vi.mock('../../src/repositories/PaymentRepository.js', () => ({
  PaymentRepository: vi.fn().mockImplementation(() => paymentRepoMock),
}));

vi.mock('../../src/shared/middlewares/authMiddleware.js', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    const raw = req.headers['x-test-user'];
    if (!raw) return res.status(401).json({ error: 'Não autenticado' });
    req.user = JSON.parse(raw as string);
    next();
  },
}));

const { createApp } = await import('../../src/app/createApp.js');

const app = createApp();

function authHeader(role: 'admin' | 'resident' = 'admin') {
  return { 'x-test-user': JSON.stringify({ id: 'user-1', role, republicId: 'republic-1' }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  monthlyBalanceRepoMock.findByResidentAndMonth.mockResolvedValue(null);
  paymentRepoMock.findByResidentAndMonth.mockResolvedValue([]);
  monthlyBalanceRepoMock.upsert.mockImplementation(async (data: any) => data);
});

describe('GET /api/monthly-balance/:year/:month', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/monthly-balance/2026/6');
    expect(res.status).toBe(401);
  });

  it('rejeita year/month inválidos', async () => {
    const res = await request(app).get('/api/monthly-balance/2026/13').set(authHeader());
    expect(res.status).toBe(400);
  });

  it('divide a cota igualmente entre moradores ativos sem histórico', async () => {
    residentRepoMock.findAll.mockResolvedValue({
      data: [
        { _id: 'r1', fullName: 'Fulano', nickname: 'fulano' },
        { _id: 'r2', fullName: 'Beltrano', nickname: 'beltrano' },
      ],
      total: 2,
    });
    expenseRepoMock.findAll.mockResolvedValue({ data: [{ amount: 300 }], total: 1 });
    monthlyBalanceRepoMock.findByMonth.mockResolvedValue([]);

    const res = await request(app).get('/api/monthly-balance/2026/6').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.perPersonAmount).toBe(150);
    expect(res.body.data.activeResidents).toBe(2);
    expect(res.body.data.balances).toHaveLength(2);
    expect(res.body.data.balances[0]).toMatchObject({
      residentId: 'r1',
      currentMonthDue: 150,
      totalDue: 150,
      totalPaid: 0,
      remainingBalance: 150,
    });
    expect(monthlyBalanceRepoMock.upsert).toHaveBeenCalledTimes(2);
  });

  it('redistribui a cota de quem está inativo no mês entre os demais', async () => {
    residentRepoMock.findAll.mockResolvedValue({
      data: [
        { _id: 'r1', fullName: 'Fulano', nickname: 'fulano' },
        { _id: 'r2', fullName: 'Beltrano', nickname: 'beltrano' },
      ],
      total: 2,
    });
    expenseRepoMock.findAll.mockResolvedValue({ data: [{ amount: 300 }], total: 1 });
    // r2 foi marcado como inativo neste mês (ex.: saiu da república)
    monthlyBalanceRepoMock.findByMonth.mockResolvedValue([
      { residentId: 'r2', isActive: false, exitDay: null },
    ]);

    const res = await request(app).get('/api/monthly-balance/2026/6').set(authHeader());

    expect(res.status).toBe(200);
    // Só r1 é ativo: a cota inteira (300) cai sobre ele
    expect(res.body.data.perPersonAmount).toBe(300);
    expect(res.body.data.activeResidents).toBe(1);
    const r1Balance = res.body.data.balances.find((b: any) => b.residentId === 'r1');
    const r2Balance = res.body.data.balances.find((b: any) => b.residentId === 'r2');
    expect(r1Balance.currentMonthDue).toBe(300);
    expect(r2Balance.currentMonthDue).toBe(0);
  });

  it('considera pagamentos e saldo anterior no cálculo do saldo restante', async () => {
    residentRepoMock.findAll.mockResolvedValue({
      data: [{ _id: 'r1', fullName: 'Fulano', nickname: 'fulano' }],
      total: 1,
    });
    expenseRepoMock.findAll.mockResolvedValue({ data: [{ amount: 100 }], total: 1 });
    monthlyBalanceRepoMock.findByMonth.mockResolvedValue([]);
    monthlyBalanceRepoMock.findByResidentAndMonth.mockResolvedValue({ currentBalance: 50 });
    paymentRepoMock.findByResidentAndMonth.mockResolvedValue([{ amount: 30 }]);

    const res = await request(app).get('/api/monthly-balance/2026/6').set(authHeader());

    expect(res.status).toBe(200);
    const balance = res.body.data.balances[0];
    expect(balance.previousBalance).toBe(50);
    expect(balance.currentMonthDue).toBe(100);
    expect(balance.totalDue).toBe(150);
    expect(balance.totalPaid).toBe(30);
    expect(balance.remainingBalance).toBe(120);
  });
});

describe('PUT /api/monthly-balance/:year/:month/:residentId/status', () => {
  it('rejeita quando o usuário não é admin (403)', async () => {
    const res = await request(app)
      .put('/api/monthly-balance/2026/6/r1/status')
      .set(authHeader('resident'))
      .send({ isActive: false });

    expect(res.status).toBe(403);
  });

  it('exige isActive booleano', async () => {
    const res = await request(app)
      .put('/api/monthly-balance/2026/6/r1/status')
      .set(authHeader())
      .send({ isActive: 'sim' });

    expect(res.status).toBe(400);
  });

  it('atualiza o status do morador no mês', async () => {
    const res = await request(app)
      .put('/api/monthly-balance/2026/6/r1/status')
      .set(authHeader())
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(monthlyBalanceRepoMock.upsert).toHaveBeenCalledWith({
      residentId: 'r1',
      year: 2026,
      month: 6,
      isActive: false,
    });
  });
});

describe('PUT /api/monthly-balance/:year/:month/:residentId/proportional', () => {
  it('rejeita exitDay fora do intervalo 1-31', async () => {
    const res = await request(app)
      .put('/api/monthly-balance/2026/6/r1/proportional')
      .set(authHeader())
      .send({ exitDay: 32 });

    expect(res.status).toBe(400);
  });

  it('calcula o fator proporcional a partir do exitDay (junho tem 30 dias)', async () => {
    const res = await request(app)
      .put('/api/monthly-balance/2026/6/r1/proportional')
      .set(authHeader())
      .send({ exitDay: 15 });

    expect(res.status).toBe(200);
    expect(monthlyBalanceRepoMock.upsert).toHaveBeenCalledWith({
      residentId: 'r1',
      year: 2026,
      month: 6,
      exitDay: 15,
      proportionalFactor: 0.5,
    });
  });
});

describe('DELETE /api/monthly-balance/:year/:month/:residentId/proportional', () => {
  it('remove o cálculo proporcional (volta ao mês inteiro)', async () => {
    const res = await request(app)
      .delete('/api/monthly-balance/2026/6/r1/proportional')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(monthlyBalanceRepoMock.upsert).toHaveBeenCalledWith({
      residentId: 'r1',
      year: 2026,
      month: 6,
      exitDay: null,
      proportionalFactor: 1,
    });
  });
});

describe('POST /api/monthly-balance/:year/:month/:residentId/payment', () => {
  it('rejeita amount inválido', async () => {
    const res = await request(app)
      .post('/api/monthly-balance/2026/6/r1/payment')
      .set(authHeader())
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('registra um pagamento', async () => {
    paymentRepoMock.save.mockImplementation(async (p: any) => p);

    const res = await request(app)
      .post('/api/monthly-balance/2026/6/r1/payment')
      .set(authHeader())
      .send({ amount: 150 });

    expect(res.status).toBe(201);
    expect(res.body.data.residentId).toBe('r1');
    expect(res.body.data.month).toBe('2026-06');
    expect(res.body.data.amount).toBe(150);
  });
});

describe('DELETE /api/monthly-balance/payment/:paymentId', () => {
  it('remove o pagamento', async () => {
    const res = await request(app)
      .delete('/api/monthly-balance/payment/p1')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(paymentRepoMock.delete).toHaveBeenCalledWith('p1');
  });
});
