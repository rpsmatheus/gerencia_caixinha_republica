import { describe, it, expect } from 'vitest';
import argon2 from 'argon2';
import { ResidentFactory } from '../../src/factories/ResidentFactory.js';

function validData(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'João da Silva',
    nickname: 'JOAOZINHO',
    republicId: 'republic-1',
    password: 'senha-super-secreta',
    ...overrides,
  };
}

describe('ResidentFactory.create', () => {
  it('cria um morador válido com valores padrão', async () => {
    const resident = await ResidentFactory.create(validData());

    expect(resident.fullName).toBe('João da Silva');
    expect(resident.nickname).toBe('joaozinho');
    expect(resident.republicId).toBe('republic-1');
    expect(resident.category).toBe('Bixo');
    expect(resident.role).toBe('resident');
    expect(resident.mustChangePassword).toBe(true);
    expect(resident.isActive).toBe(true);
    expect(resident.joinDate).toBeInstanceOf(Date);
  });

  it('converte o nickname para minúsculas', async () => {
    const resident = await ResidentFactory.create(validData({ nickname: 'MaRcElA' }));
    expect(resident.nickname).toBe('marcela');
  });

  it('gera um hash argon2 válido para a senha', async () => {
    const resident = await ResidentFactory.create(validData({ password: 'minhaSenha123' }));

    expect(resident.passwordHash).not.toBe('minhaSenha123');
    await expect(argon2.verify(resident.passwordHash, 'minhaSenha123')).resolves.toBe(true);
  });

  it('aceita uma categoria válida informada', async () => {
    const resident = await ResidentFactory.create(validData({ category: 'Morador' }));
    expect(resident.category).toBe('Morador');
  });

  it('usa "Bixo" como categoria padrão quando a categoria informada é inválida', async () => {
    const resident = await ResidentFactory.create(validData({ category: 'Inexistente' }));
    expect(resident.category).toBe('Bixo');
  });

  it('define role como admin apenas quando explicitamente informado', async () => {
    const admin = await ResidentFactory.create(validData({ role: 'admin' }));
    expect(admin.role).toBe('admin');

    const resident = await ResidentFactory.create(validData({ role: 'outro' }));
    expect(resident.role).toBe('resident');
  });

  it('lança erro quando fullName está ausente', async () => {
    await expect(ResidentFactory.create(validData({ fullName: undefined }))).rejects.toThrow(
      'fullName obrigatório'
    );
  });

  it('lança erro quando nickname está ausente', async () => {
    await expect(ResidentFactory.create(validData({ nickname: undefined }))).rejects.toThrow(
      'nickname obrigatório'
    );
  });

  it('lança erro quando republicId está ausente', async () => {
    await expect(ResidentFactory.create(validData({ republicId: undefined }))).rejects.toThrow(
      'republicId obrigatório'
    );
  });

  it('lança erro quando password está ausente', async () => {
    await expect(ResidentFactory.create(validData({ password: undefined }))).rejects.toThrow(
      'password obrigatório'
    );
  });
});
