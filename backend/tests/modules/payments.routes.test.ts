import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { paymentRepoMock } = vi.hoisted(() => ({
  paymentRepoMock: {
    findByMonth: vi.fn(),
    findByResidentAndMonth: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/repositories/PaymentRepository.js', () => ({
  PaymentRepository: vi.fn().mockImplementation(() => paymentRepoMock),
}));

const { createApp } = await import('../../src/app/createApp.js');

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/payments', () => {
  it('exige o parâmetro month', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(400);
  });

  it('lista pagamentos do mês quando residentId não é informado', async () => {
    paymentRepoMock.findByMonth.mockResolvedValue([{ id: 'p1', residentId: 'r1', month: '2026-06', amount: 100 }]);

    const res = await request(app).get('/api/payments?month=2026-06');

    expect(res.status).toBe(200);
    expect(paymentRepoMock.findByMonth).toHaveBeenCalledWith('2026-06');
    expect(res.body.data).toHaveLength(1);
  });

  it('filtra por morador quando residentId é informado', async () => {
    paymentRepoMock.findByResidentAndMonth.mockResolvedValue([]);

    const res = await request(app).get('/api/payments?month=2026-06&residentId=r1');

    expect(res.status).toBe(200);
    expect(paymentRepoMock.findByResidentAndMonth).toHaveBeenCalledWith('r1', '2026-06');
    expect(paymentRepoMock.findByMonth).not.toHaveBeenCalled();
  });
});

describe('POST /api/payments', () => {
  it('cria um pagamento válido', async () => {
    paymentRepoMock.save.mockImplementation(async (p: any) => p);

    const res = await request(app)
      .post('/api/payments')
      .send({ residentId: 'r1', month: '2026-06', amount: 150 });

    expect(res.status).toBe(201);
    expect(res.body.data.residentId).toBe('r1');
  });

  it('propaga o erro de validação da factory (sem handler de erro customizado)', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ residentId: 'r1', month: 'mes-invalido', amount: 150 });

    expect(res.status).toBe(500);
    expect(paymentRepoMock.save).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/payments/:id', () => {
  it('remove o pagamento', async () => {
    paymentRepoMock.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/api/payments/p1');

    expect(res.status).toBe(200);
    expect(paymentRepoMock.delete).toHaveBeenCalledWith('p1');
  });
});
