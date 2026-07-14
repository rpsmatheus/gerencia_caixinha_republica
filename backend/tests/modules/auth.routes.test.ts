import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { ObjectId } from 'mongodb';

const { mockFindOne, mockUpdateOne, residentRepoMock } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
  mockUpdateOne: vi.fn(),
  residentRepoMock: {
    findByNicknameWithPassword: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('../../src/config/database.js', () => ({
  DatabaseConnection: {
    getInstance: () => ({
      getDatabase: () => ({
        collection: () => ({
          findOne: mockFindOne,
          updateOne: mockUpdateOne,
        }),
      }),
    }),
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

const RESIDENT_ID = '507f1f77bcf86cd799439011';

function authHeader(user: { id: string; role: string; republicId: string }) {
  return { 'x-test-user': JSON.stringify(user) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('cria um novo administrador e retorna um accessToken', async () => {
    residentRepoMock.findByNicknameWithPassword.mockResolvedValue(null);
    residentRepoMock.save.mockImplementation(async (data: any) => ({
      ...data,
      _id: new ObjectId(RESIDENT_ID),
    }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nickname: 'admin1', password: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.resident.nickname).toBe('admin1');
    expect(res.body.data.resident.role).toBe('admin');
  });

  it('rejeita quando nickname ou password estão ausentes', async () => {
    const res = await request(app).post('/api/auth/register').send({ nickname: 'admin1' });
    expect(res.status).toBe(400);
  });

  it('rejeita senha com menos de 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nickname: 'admin1', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejeita nickname já em uso (409)', async () => {
    residentRepoMock.findByNicknameWithPassword.mockResolvedValue({ nickname: 'admin1' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nickname: 'admin1', password: 'senha123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('autentica com credenciais válidas', async () => {
    const passwordHash = await argon2.hash('senha123');
    residentRepoMock.findByNicknameWithPassword.mockResolvedValue({
      _id: new ObjectId(RESIDENT_ID),
      nickname: 'admin1',
      fullName: 'admin1',
      role: 'admin',
      republicId: 'republic-1',
      isActive: true,
      mustChangePassword: false,
      passwordHash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin1', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.resident.nickname).toBe('admin1');
  });

  it('rejeita senha incorreta com 401', async () => {
    const passwordHash = await argon2.hash('senha123');
    residentRepoMock.findByNicknameWithPassword.mockResolvedValue({
      _id: new ObjectId(RESIDENT_ID),
      nickname: 'admin1',
      role: 'admin',
      republicId: 'republic-1',
      passwordHash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin1', password: 'senha-errada' });

    expect(res.status).toBe(401);
  });

  it('rejeita usuário inexistente com 401', async () => {
    residentRepoMock.findByNicknameWithPassword.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'inexistente', password: 'senha123' });

    expect(res.status).toBe(401);
  });

  it('rejeita quando identifier ou password estão ausentes', async () => {
    const res = await request(app).post('/api/auth/login').send({ identifier: 'admin1' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('sempre responde com sucesso, sem exigir autenticação', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna os dados do usuário autenticado', async () => {
    mockFindOne.mockResolvedValue({
      _id: new ObjectId(RESIDENT_ID),
      nickname: 'admin1',
      fullName: 'admin1',
      role: 'admin',
      isActive: true,
      mustChangePassword: false,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader({ id: RESIDENT_ID, role: 'admin', republicId: 'republic-1' }));

    expect(res.status).toBe(200);
    expect(res.body.data.resident.nickname).toBe('admin1');
  });
});

describe('POST /api/auth/change-password', () => {
  it('exige autenticação', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: 'a', newPassword: 'b' });
    expect(res.status).toBe(401);
  });

  it('rejeita quando a senha atual está incorreta', async () => {
    const passwordHash = await argon2.hash('senha-certa');
    mockFindOne.mockResolvedValue({ _id: new ObjectId(RESIDENT_ID), passwordHash });

    const res = await request(app)
      .post('/api/auth/change-password')
      .set(authHeader({ id: RESIDENT_ID, role: 'admin', republicId: 'republic-1' }))
      .send({ currentPassword: 'senha-errada', newPassword: 'nova-senha-123' });

    expect(res.status).toBe(401);
  });

  it('troca a senha com sucesso', async () => {
    const passwordHash = await argon2.hash('senha-certa');
    mockFindOne.mockResolvedValue({ _id: new ObjectId(RESIDENT_ID), passwordHash });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });

    const res = await request(app)
      .post('/api/auth/change-password')
      .set(authHeader({ id: RESIDENT_ID, role: 'admin', republicId: 'republic-1' }))
      .send({ currentPassword: 'senha-certa', newPassword: 'nova-senha-123' });

    expect(res.status).toBe(200);
    expect(mockUpdateOne).toHaveBeenCalled();
  });
});
