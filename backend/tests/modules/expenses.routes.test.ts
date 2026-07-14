import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';

const { expenseRepoMock } = vi.hoisted(() => ({
  expenseRepoMock: {
    findAll: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/repositories/ExpenseRepository.js', () => ({
  ExpenseRepository: vi.fn().mockImplementation(() => expenseRepoMock),
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

const EXPENSE_ID = '507f1f77bcf86cd799439020';

function authHeader() {
  return { 'x-test-user': JSON.stringify({ id: 'user-1', role: 'admin', republicId: 'republic-1' }) };
}

function makeExpense(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(EXPENSE_ID),
    userId: 'user-1',
    republicId: 'republic-1',
    description: 'Conta de luz',
    category: 'Utilidades',
    amount: 150,
    expenseDate: new Date('2026-06-10'),
    notes: undefined,
    proofUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/expenses', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('lista despesas paginadas e monta a paginação corretamente', async () => {
    expenseRepoMock.findAll.mockResolvedValue({ data: [makeExpense()], total: 25 });

    const res = await request(app).get('/api/expenses?page=2&limit=10').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 2, limit: 10, total: 25, pages: 3 });
    expect(res.body.data[0]).toMatchObject({
      id: EXPENSE_ID,
      description: 'Conta de luz',
      expenseDate: '2026-06-10',
    });
  });

  it('repassa os filtros de query para o repository', async () => {
    expenseRepoMock.findAll.mockResolvedValue({ data: [], total: 0 });

    await request(app)
      .get('/api/expenses?category=Utilidades&minAmount=50&maxAmount=200&search=luz')
      .set(authHeader());

    expect(expenseRepoMock.findAll).toHaveBeenCalledWith(
      { id: 'user-1', role: 'admin', republicId: 'republic-1' },
      1,
      10,
      expect.objectContaining({
        category: 'Utilidades',
        minAmount: 50,
        maxAmount: 200,
        search: 'luz',
      })
    );
  });
});

describe('GET /api/expenses/:id', () => {
  it('retorna 404 quando a despesa não existe', async () => {
    expenseRepoMock.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/expenses/${EXPENSE_ID}`).set(authHeader());

    expect(res.status).toBe(404);
  });

  it('retorna a despesa quando encontrada', async () => {
    expenseRepoMock.findById.mockResolvedValue(makeExpense());

    const res = await request(app).get(`/api/expenses/${EXPENSE_ID}`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(EXPENSE_ID);
  });
});

describe('POST /api/expenses', () => {
  it('cria uma despesa válida', async () => {
    expenseRepoMock.save.mockImplementation(async (e: any) => ({ ...e, _id: new ObjectId(EXPENSE_ID) }));

    const res = await request(app)
      .post('/api/expenses')
      .set(authHeader())
      .send({
        description: 'Internet',
        category: 'Internet',
        amount: 100,
        expenseDate: '2026-06-05',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('Internet');
  });

  it('cria despesa com URL de comprovante', async () => {
    expenseRepoMock.save.mockImplementation(async (e: any) => ({ ...e, _id: new ObjectId(EXPENSE_ID) }));

    const res = await request(app)
      .post('/api/expenses')
      .set(authHeader())
      .send({
        description: 'Internet',
        category: 'Internet',
        amount: 100,
        expenseDate: '2026-06-05',
        proofUrl: 'https://example.com/comprovante.pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.proofUrl).toBe('https://example.com/comprovante.pdf');
  });

  it('propaga o erro de validação da factory (sem handler de erro customizado)', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set(authHeader())
      .send({ description: '', category: 'Internet', amount: 100, expenseDate: '2026-06-05' });

    expect(res.status).toBe(500);
    expect(expenseRepoMock.save).not.toHaveBeenCalled();
  });
});

describe('PUT /api/expenses/:id', () => {
  it('retorna 404 quando a despesa não existe', async () => {
    expenseRepoMock.update.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/expenses/${EXPENSE_ID}`)
      .set(authHeader())
      .send({ amount: 200 });

    expect(res.status).toBe(404);
  });

  it('atualiza os campos informados', async () => {
    expenseRepoMock.update.mockResolvedValue(makeExpense({ amount: 200 }));

    const res = await request(app)
      .put(`/api/expenses/${EXPENSE_ID}`)
      .set(authHeader())
      .send({ amount: 200 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(200);
    expect(expenseRepoMock.update).toHaveBeenCalledWith(
      EXPENSE_ID,
      { amount: 200 },
      { id: 'user-1', role: 'admin', republicId: 'republic-1' }
    );
  });

  it('atualiza a URL do comprovante', async () => {
    expenseRepoMock.update.mockResolvedValue(makeExpense({ proofUrl: 'https://example.com/nota.png' }));

    const res = await request(app)
      .put(`/api/expenses/${EXPENSE_ID}`)
      .set(authHeader())
      .send({ proofUrl: ' https://example.com/nota.png ' });

    expect(res.status).toBe(200);
    expect(res.body.data.proofUrl).toBe('https://example.com/nota.png');
    expect(expenseRepoMock.update).toHaveBeenCalledWith(
      EXPENSE_ID,
      { proofUrl: 'https://example.com/nota.png' },
      { id: 'user-1', role: 'admin', republicId: 'republic-1' }
    );
  });
});

describe('DELETE /api/expenses/:id', () => {
  it('remove a despesa', async () => {
    expenseRepoMock.delete.mockResolvedValue(undefined);

    const res = await request(app).delete(`/api/expenses/${EXPENSE_ID}`).set(authHeader());

    expect(res.status).toBe(200);
    expect(expenseRepoMock.delete).toHaveBeenCalledWith(EXPENSE_ID, {
      id: 'user-1',
      role: 'admin',
      republicId: 'republic-1',
    });
  });
});
