import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const { expenseRepoMock } = vi.hoisted(() => ({
  expenseRepoMock: {
    findAll: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clearProof: vi.fn(),
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
const { PROOF_UPLOAD_DIR } = await import('../../src/shared/middlewares/uploadMiddleware.js');

const app = createApp();
const uploadedFiles: string[] = [];

afterAll(() => {
  for (const name of uploadedFiles) {
    fs.rmSync(path.join(PROOF_UPLOAD_DIR, name), { force: true });
  }
});

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
    proofFileName: undefined,
    proofOriginalName: undefined,
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

describe('POST /api/expenses/:id/proof', () => {
  it('envia um PDF como comprovante', async () => {
    expenseRepoMock.findById.mockResolvedValue(makeExpense());
    expenseRepoMock.update.mockImplementation(async (_id: string, patch: any) => {
      uploadedFiles.push(patch.proofFileName);
      return makeExpense(patch);
    });

    const res = await request(app)
      .post(`/api/expenses/${EXPENSE_ID}/proof`)
      .set(authHeader())
      .attach('file', Buffer.from('%PDF-1.4 conteúdo fake'), {
        filename: 'nota.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.hasProof).toBe(true);
    expect(res.body.data.proofOriginalName).toBe('nota.pdf');
    expect(expenseRepoMock.update).toHaveBeenCalledWith(
      EXPENSE_ID,
      expect.objectContaining({ proofOriginalName: 'nota.pdf' }),
      { id: 'user-1', role: 'admin', republicId: 'republic-1' }
    );
  });

  it('rejeita arquivo que não é PDF', async () => {
    expenseRepoMock.findById.mockResolvedValue(makeExpense());

    const res = await request(app)
      .post(`/api/expenses/${EXPENSE_ID}/proof`)
      .set(authHeader())
      .attach('file', Buffer.from('fake image'), {
        filename: 'foto.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(400);
    expect(expenseRepoMock.update).not.toHaveBeenCalled();
  });

  it('retorna 404 quando a despesa não existe ou é de outra república', async () => {
    expenseRepoMock.findById.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/expenses/${EXPENSE_ID}/proof`)
      .set(authHeader())
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'nota.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/expenses/:id/proof', () => {
  it('baixa o comprovante quando existe', async () => {
    const fileName = `${Date.now()}-test.pdf`;
    fs.mkdirSync(PROOF_UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(PROOF_UPLOAD_DIR, fileName), '%PDF-1.4 conteúdo fake');
    uploadedFiles.push(fileName);

    expenseRepoMock.findById.mockResolvedValue(
      makeExpense({ proofFileName: fileName, proofOriginalName: 'nota.pdf' })
    );

    const res = await request(app).get(`/api/expenses/${EXPENSE_ID}/proof`).set(authHeader());

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando não há comprovante', async () => {
    expenseRepoMock.findById.mockResolvedValue(makeExpense());

    const res = await request(app).get(`/api/expenses/${EXPENSE_ID}/proof`).set(authHeader());

    expect(res.status).toBe(404);
  });

  it('bloqueia acesso a despesa de outra república', async () => {
    // findById já filtra por republicId no repository real — aqui simulamos o retorno null
    expenseRepoMock.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/expenses/${EXPENSE_ID}/proof`).set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/expenses/:id/proof', () => {
  it('remove o comprovante', async () => {
    const fileName = `${Date.now()}-delete.pdf`;
    fs.mkdirSync(PROOF_UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(PROOF_UPLOAD_DIR, fileName), '%PDF-1.4 conteúdo fake');

    expenseRepoMock.findById.mockResolvedValue(
      makeExpense({ proofFileName: fileName, proofOriginalName: 'nota.pdf' })
    );
    expenseRepoMock.clearProof.mockResolvedValue(makeExpense());

    const res = await request(app).delete(`/api/expenses/${EXPENSE_ID}/proof`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.hasProof).toBe(false);
    expect(expenseRepoMock.clearProof).toHaveBeenCalledWith(EXPENSE_ID, {
      id: 'user-1',
      role: 'admin',
      republicId: 'republic-1',
    });
  });

  it('retorna 404 quando não há comprovante para remover', async () => {
    expenseRepoMock.findById.mockResolvedValue(makeExpense());

    const res = await request(app).delete(`/api/expenses/${EXPENSE_ID}/proof`).set(authHeader());

    expect(res.status).toBe(404);
  });
});
