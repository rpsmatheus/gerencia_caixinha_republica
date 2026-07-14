import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, JwtPayload } from '../../src/shared/jwt.js';

const payload: JwtPayload = {
  sub: 'resident-1',
  role: 'admin',
  republicId: 'republic-1',
};

describe('jwt sign/verify', () => {
  it('assina e verifica um token válido, preservando o payload', async () => {
    const token = await signAccessToken(payload);
    const decoded = await verifyAccessToken(token);

    expect(decoded).toEqual(payload);
  });

  it('gera um token no formato JWT (header.payload.signature)', async () => {
    const token = await signAccessToken(payload);
    expect(token.split('.')).toHaveLength(3);
  });

  it('preserva o papel de resident no payload', async () => {
    const token = await signAccessToken({ ...payload, role: 'resident' });
    const decoded = await verifyAccessToken(token);
    expect(decoded.role).toBe('resident');
  });

  it('rejeita um token corrompido', async () => {
    const token = await signAccessToken(payload);
    const tampered = token.slice(0, -2) + 'xx';

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejeita uma string que não é um JWT', async () => {
    await expect(verifyAccessToken('isso-nao-e-um-token')).rejects.toThrow();
  });
});
