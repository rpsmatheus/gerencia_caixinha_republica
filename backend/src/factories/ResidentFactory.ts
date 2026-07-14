import argon2 from 'argon2';
import { IResident, ResidentCategory } from '../models/Resident.js';

const VALID_CATEGORIES: ResidentCategory[] = ['Bixo', 'Agregado', 'Morador'];

export class ResidentFactory {
  static async create(data: any): Promise<IResident> {
    if (!data.fullName) throw new Error("fullName obrigatório");
    if (!data.nickname) throw new Error("nickname obrigatório");
    if (!data.republicId) throw new Error("republicId obrigatório");
    if (!data.password) throw new Error("password obrigatório");

    const passwordHash = await argon2.hash(data.password);
    const category: ResidentCategory = VALID_CATEGORIES.includes(data.category)
      ? data.category
      : 'Bixo';

    return {
      fullName: data.fullName,
      nickname: data.nickname.toLowerCase(),
      whatsappNumber: data.whatsappNumber ?? data.phone ?? undefined,
      category,
      republicId: data.republicId,
      role: data.role === 'admin' ? 'admin' : 'resident',
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}