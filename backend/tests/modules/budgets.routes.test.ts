import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';

const { budgetRepoMock, budgetTemplateRepoMock, expenseRepoMock, residentRepoMock } = vi.hoisted(() => ({
  budgetRepoMock: {
    findByMonth: vi.fn(),
    findById: vi.fn(),
    findByDescriptionForMonth: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  budgetTemplateRepoMock: {
    findAllByRepublic: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  expenseRepoMock: { save: vi.fn() },
  residentRepoMock: { findAll: vi.fn() },
}));

vi.mock('../../src/repositories/BudgetRepository.js', () => ({
  BudgetRepository: vi.fn().mockImplementation(() => budgetRepoMock),
}));
vi.mock('../../src/repositories/BudgetTemplateRepository.js', () => ({
  BudgetTemplateRepository: vi.fn().mockImplementation(() => budgetTemplateRepoMock),
}));
vi.mock('../../src/repositories/ExpenseRepository.js', () => ({
  ExpenseRepository: vi.fn().mockImplementation(() => expenseRepoMock),
}));
vi.mock('../../src/repositories/ResidentRepository.js', () => ({
  ResidentRepository: vi.fn().mockImplementation(() => residentRepoMock),
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

function makeBudget(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    republicId: 'republic-1',
    year: 2026,
    month: 6,
    description: 'Água',
    category: 'Utilidades',
    amount: 80,
    isApplied: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/budgets/templates', () => {
  it('lista os modelos de orçamento da república', async () => {
    budgetTemplateRepoMock.findAllByRepublic.mockResolvedValue([{ id: 't1', description: 'Água' }]);

    const res = await request(app).get('/api/budgets/templates').set(authHeader('resident'));

    expect(res.status).toBe(200);
    expect(budgetTemplateRepoMock.findAllByRepublic).toHaveBeenCalledWith('republic-1');
  });
});

describe('POST /api/budgets/templates', () => {
  it('rejeita quando o usuário não é admin (403)', async () => {
    const res = await request(app)
      .post('/api/budgets/templates')
      .set(authHeader('resident'))
      .send({ description: 'Água', category: 'Utilidades', amount: 80 });

    expect(res.status).toBe(403);
  });

  it('rejeita campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post('/api/budgets/templates')
      .set(authHeader())
      .send({ description: '', category: 'Utilidades', amount: 80 });

    expect(res.status).toBe(400);
  });

  it('cria um modelo de orçamento', async () => {
    budgetTemplateRepoMock.create.mockResolvedValue({ id: 't1', description: 'Água', category: 'Utilidades', amount: 80 });

    const res = await request(app)
      .post('/api/budgets/templates')
      .set(authHeader())
      .send({ description: 'Água', category: 'Utilidades', amount: 80 });

    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('Água');
  });
});

describe('GET /api/budgets/:year/:month', () => {
  it('rejeita year/month inválidos', async () => {
    const res = await request(app).get('/api/budgets/2026/13').set(authHeader());
    expect(res.status).toBe(400);
  });

  it('calcula o total do orçamento e a divisão por pessoa', async () => {
    budgetRepoMock.findByMonth.mockResolvedValue([makeBudget({ amount: 80 }), makeBudget({ id: 'b2', amount: 120 })]);
    residentRepoMock.findAll.mockResolvedValue({
      data: [{ isActive: true }, { isActive: true }],
      total: 2,
    });

    const res = await request(app).get('/api/budgets/2026/6').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.budgetsTotal).toBe(200);
    expect(res.body.data.activeResidents).toBe(2);
    expect(res.body.data.perPersonDivision).toBe(100);
  });
});

describe('POST /api/budgets/:year/:month', () => {
  it('rejeita quando o usuário não é admin (403)', async () => {
    const res = await request(app)
      .post('/api/budgets/2026/6')
      .set(authHeader('resident'))
      .send({ description: 'Reforma da cozinha', category: 'Moradia', amount: 500 });

    expect(res.status).toBe(403);
  });

  it('rejeita year/month inválidos', async () => {
    const res = await request(app)
      .post('/api/budgets/2026/13')
      .set(authHeader())
      .send({ description: 'Reforma da cozinha', category: 'Moradia', amount: 500 });

    expect(res.status).toBe(400);
  });

  it('rejeita campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post('/api/budgets/2026/6')
      .set(authHeader())
      .send({ description: '', category: 'Moradia', amount: 500 });

    expect(res.status).toBe(400);
    expect(budgetRepoMock.create).not.toHaveBeenCalled();
  });

  it('rejeita amount inválido', async () => {
    const res = await request(app)
      .post('/api/budgets/2026/6')
      .set(authHeader())
      .send({ description: 'Reforma da cozinha', category: 'Moradia', amount: 0 });

    expect(res.status).toBe(400);
    expect(budgetRepoMock.create).not.toHaveBeenCalled();
  });

  it('cria um orçamento avulso direto no mês, sem depender de um modelo', async () => {
    budgetRepoMock.create.mockResolvedValue(
      makeBudget({ id: 'b9', description: 'Reforma da cozinha', category: 'Moradia', amount: 500 })
    );

    const res = await request(app)
      .post('/api/budgets/2026/6')
      .set(authHeader())
      .send({ description: 'Reforma da cozinha', category: 'Moradia', amount: 500 });

    expect(res.status).toBe(201);
    expect(budgetRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        republicId: 'republic-1',
        year: 2026,
        month: 6,
        description: 'Reforma da cozinha',
        category: 'Moradia',
        amount: 500,
      })
    );
    expect(res.body.data.description).toBe('Reforma da cozinha');
  });
});

describe('POST /api/budgets/simulate/:year/:month', () => {
  it('cria orçamentos apenas para modelos ainda não simulados neste mês', async () => {
    budgetTemplateRepoMock.findAllByRepublic.mockResolvedValue([
      { description: 'Água', category: 'Utilidades', amount: 80 },
      { description: 'Luz', category: 'Utilidades', amount: 150 },
    ]);
    // "Água" já foi simulada este mês; "Luz" ainda não
    budgetRepoMock.findByDescriptionForMonth.mockImplementation(async (_r, _y, _m, description: string) =>
      description === 'Água' ? makeBudget({ description: 'Água' }) : null
    );
    budgetRepoMock.create.mockResolvedValue(makeBudget({ id: 'b2', description: 'Luz', amount: 150 }));
    budgetRepoMock.findByMonth.mockResolvedValue([makeBudget({ description: 'Água' }), makeBudget({ id: 'b2', description: 'Luz', amount: 150 })]);

    const res = await request(app).post('/api/budgets/simulate/2026/6').set(authHeader());

    expect(res.status).toBe(201);
    expect(budgetRepoMock.create).toHaveBeenCalledTimes(1);
    expect(budgetRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Luz', amount: 150 })
    );
    expect(res.body.data).toHaveLength(2);
  });
});

describe('POST /api/budgets/:id/apply', () => {
  it('retorna 404 quando o orçamento não existe', async () => {
    budgetRepoMock.findById.mockResolvedValue(null);

    const res = await request(app).post('/api/budgets/b1/apply').set(authHeader());

    expect(res.status).toBe(404);
  });

  it('rejeita orçamento já aplicado (409)', async () => {
    budgetRepoMock.findById.mockResolvedValue(makeBudget({ isApplied: true }));

    const res = await request(app).post('/api/budgets/b1/apply').set(authHeader());

    expect(res.status).toBe(409);
  });

  it('converte o orçamento em uma despesa real', async () => {
    budgetRepoMock.findById.mockResolvedValue(makeBudget());
    expenseRepoMock.save.mockImplementation(async (e: any) => ({ ...e, _id: new ObjectId('507f1f77bcf86cd799439030') }));
    budgetRepoMock.update.mockResolvedValue(makeBudget({ isApplied: true }));

    const res = await request(app).post('/api/budgets/b1/apply').set(authHeader());

    expect(res.status).toBe(200);
    expect(expenseRepoMock.save).toHaveBeenCalled();
    expect(budgetRepoMock.update).toHaveBeenCalledWith(
      'b1',
      'republic-1',
      expect.objectContaining({ isApplied: true, appliedExpenseId: '507f1f77bcf86cd799439030' })
    );
  });
});

describe('PUT /api/budgets/:id', () => {
  it('rejeita amount inválido', async () => {
    const res = await request(app).put('/api/budgets/b1').set(authHeader()).send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando o orçamento não existe', async () => {
    budgetRepoMock.findById.mockResolvedValue(null);

    const res = await request(app).put('/api/budgets/b1').set(authHeader()).send({ amount: 200 });

    expect(res.status).toBe(404);
  });

  it('atualiza o valor planejado', async () => {
    budgetRepoMock.findById.mockResolvedValue(makeBudget());
    budgetRepoMock.update.mockResolvedValue(makeBudget({ amount: 200 }));

    const res = await request(app).put('/api/budgets/b1').set(authHeader()).send({ amount: 200 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(200);
  });
});

describe('DELETE /api/budgets/:id', () => {
  it('remove o orçamento', async () => {
    budgetRepoMock.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/api/budgets/b1').set(authHeader());

    expect(res.status).toBe(200);
    expect(budgetRepoMock.delete).toHaveBeenCalledWith('b1', 'republic-1');
  });
});
