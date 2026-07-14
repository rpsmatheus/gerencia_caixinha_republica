import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { categoryRepoMock } = vi.hoisted(() => ({
  categoryRepoMock: {
    findAllByRepublic: vi.fn(),
    findByNameAndRepublic: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/repositories/CategoryRepository.js', () => ({
  CategoryRepository: vi.fn().mockImplementation(() => categoryRepoMock),
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
});

describe('GET /api/categories', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('lista as categorias da república do usuário', async () => {
    categoryRepoMock.findAllByRepublic.mockResolvedValue([{ id: 'c1', name: 'Moradia' }]);

    const res = await request(app).get('/api/categories').set(authHeader('resident'));

    expect(res.status).toBe(200);
    expect(categoryRepoMock.findAllByRepublic).toHaveBeenCalledWith('republic-1');
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/categories', () => {
  it('rejeita quando o usuário não é admin (403)', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader('resident'))
      .send({ name: 'Nova categoria' });

    expect(res.status).toBe(403);
  });

  it('rejeita name vazio', async () => {
    const res = await request(app).post('/api/categories').set(authHeader()).send({ name: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejeita nome duplicado (409)', async () => {
    categoryRepoMock.findByNameAndRepublic.mockResolvedValue({ id: 'c1', name: 'Moradia' });

    const res = await request(app).post('/api/categories').set(authHeader()).send({ name: 'Moradia' });

    expect(res.status).toBe(409);
    expect(categoryRepoMock.create).not.toHaveBeenCalled();
  });

  it('cria uma nova categoria', async () => {
    categoryRepoMock.findByNameAndRepublic.mockResolvedValue(null);
    categoryRepoMock.create.mockResolvedValue({ id: 'c2', name: 'Lazer' });

    const res = await request(app).post('/api/categories').set(authHeader()).send({ name: 'Lazer' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Lazer');
  });
});

describe('DELETE /api/categories/:id', () => {
  it('rejeita quando o usuário não é admin (403)', async () => {
    const res = await request(app).delete('/api/categories/c1').set(authHeader('resident'));
    expect(res.status).toBe(403);
  });

  it('remove a categoria', async () => {
    categoryRepoMock.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/api/categories/c1').set(authHeader());

    expect(res.status).toBe(200);
    expect(categoryRepoMock.delete).toHaveBeenCalledWith('c1', 'republic-1');
  });
});
