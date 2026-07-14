import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';

const { residentRepoMock } = vi.hoisted(() => ({
  residentRepoMock: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByNicknameWithPassword: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  },
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

const ADMIN_ID = '507f1f77bcf86cd799439011';
const RESIDENT_ID = '507f1f77bcf86cd799439012';

function authHeader(user: { id: string; role: string; republicId: string }) {
  return { 'x-test-user': JSON.stringify(user) };
}

function makeResident(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(RESIDENT_ID),
    fullName: 'Fulano',
    nickname: 'fulano',
    whatsappNumber: '11999999999',
    category: 'Morador',
    isActive: true,
    role: 'resident',
    republicId: 'republic-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/residents', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/residents');
    expect(res.status).toBe(401);
  });

  it('lista os moradores da república do usuário autenticado', async () => {
    residentRepoMock.findAll.mockResolvedValue({ data: [makeResident()], total: 1 });

    const res = await request(app)
      .get('/api/residents')
      .set(authHeader({ id: ADMIN_ID, role: 'admin', republicId: 'republic-1' }));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      id: RESIDENT_ID,
      fullName: 'Fulano',
      nickname: 'fulano',
      category: 'Morador',
    });
    expect(residentRepoMock.findAll).toHaveBeenCalledWith(
      { republicId: 'republic-1', role: 'resident' },
      1,
      10
    );
  });

  it('permite acesso tanto para admin quanto para resident', async () => {
    residentRepoMock.findAll.mockResolvedValue({ data: [], total: 0 });

    const res = await request(app)
      .get('/api/residents')
      .set(authHeader({ id: RESIDENT_ID, role: 'resident', republicId: 'republic-1' }));

    expect(res.status).toBe(200);
  });
});

describe('POST /api/residents', () => {
  it('rejeita quando o usuário não é admin (403)', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set(authHeader({ id: RESIDENT_ID, role: 'resident', republicId: 'republic-1' }))
      .send({ fullName: 'Novo Morador', nickname: 'novo' });

    expect(res.status).toBe(403);
  });

  it('cria um morador e gera uma senha temporária quando nenhuma é informada', async () => {
    residentRepoMock.save.mockImplementation(async (data: any) => ({
      ...data,
      _id: new ObjectId(RESIDENT_ID),
    }));

    const res = await request(app)
      .post('/api/residents')
      .set(authHeader({ id: ADMIN_ID, role: 'admin', republicId: 'republic-1' }))
      .send({ fullName: 'Novo Morador', nickname: 'novo' });

    expect(res.status).toBe(201);
    expect(res.body.data.nickname).toBe('novo');
    expect(res.body.generatedPassword).toBeTruthy();
  });

  it('não expõe generatedPassword quando o admin informou a própria senha', async () => {
    residentRepoMock.save.mockImplementation(async (data: any) => ({
      ...data,
      _id: new ObjectId(RESIDENT_ID),
    }));

    const res = await request(app)
      .post('/api/residents')
      .set(authHeader({ id: ADMIN_ID, role: 'admin', republicId: 'republic-1' }))
      .send({ fullName: 'Novo Morador', nickname: 'novo', password: 'senha-escolhida' });

    expect(res.status).toBe(201);
    expect(res.body.generatedPassword).toBeUndefined();
  });
});

describe('PUT /api/residents/:id', () => {
  it('exige autenticação', async () => {
    const res = await request(app).put(`/api/residents/${RESIDENT_ID}`).send({ fullName: 'X' });
    expect(res.status).toBe(401);
  });

  it('permite que o próprio morador edite seus dados', async () => {
    residentRepoMock.update.mockResolvedValue(makeResident({ fullName: 'Atualizado' }));

    const res = await request(app)
      .put(`/api/residents/${RESIDENT_ID}`)
      .set(authHeader({ id: RESIDENT_ID, role: 'resident', republicId: 'republic-1' }))
      .send({ fullName: 'Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Atualizado');
  });

  it('bloqueia um morador de editar os dados de outro morador (403)', async () => {
    const res = await request(app)
      .put(`/api/residents/${ADMIN_ID}`)
      .set(authHeader({ id: RESIDENT_ID, role: 'resident', republicId: 'republic-1' }))
      .send({ fullName: 'Hackeado' });

    expect(res.status).toBe(403);
    expect(residentRepoMock.update).not.toHaveBeenCalled();
  });

  it('ignora mudança de categoria quando quem edita não é admin', async () => {
    residentRepoMock.update.mockResolvedValue(makeResident());

    await request(app)
      .put(`/api/residents/${RESIDENT_ID}`)
      .set(authHeader({ id: RESIDENT_ID, role: 'resident', republicId: 'republic-1' }))
      .send({ category: 'Agregado' });

    expect(residentRepoMock.update).toHaveBeenCalledWith(RESIDENT_ID, {});
  });

  it('permite que o admin altere a categoria de um morador', async () => {
    residentRepoMock.update.mockResolvedValue(makeResident({ category: 'Agregado' }));

    const res = await request(app)
      .put(`/api/residents/${RESIDENT_ID}`)
      .set(authHeader({ id: ADMIN_ID, role: 'admin', republicId: 'republic-1' }))
      .send({ category: 'Agregado' });

    expect(res.status).toBe(200);
    expect(residentRepoMock.update).toHaveBeenCalledWith(RESIDENT_ID, { category: 'Agregado' });
  });

  it('retorna 409 quando o novo nickname já está em uso', async () => {
    residentRepoMock.update.mockRejectedValue({ code: 11000 });

    const res = await request(app)
      .put(`/api/residents/${RESIDENT_ID}`)
      .set(authHeader({ id: ADMIN_ID, role: 'admin', republicId: 'republic-1' }))
      .send({ nickname: 'ja-existe' });

    expect(res.status).toBe(409);
  });
});
