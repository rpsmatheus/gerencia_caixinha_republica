import { IResident, ICreateResidentDTO } from '../models/Resident.js';

export class ResidentFactory {
  static create(data: ICreateResidentDTO): IResident {
    if (!data.nickname?.trim()) throw new Error('nickname obrigatório');
    if (!data.fullName?.trim()) throw new Error('fullName obrigatório');
    const now = new Date();
    return {
      nickname: data.nickname.toLowerCase().trim(),
      fullName: data.fullName.trim(),
      whatsappNumber: data.whatsappNumber,
      isActive: true,
      role: 'resident',
      joinDate: now,
      createdAt: now,
      updatedAt: now,
    };
  }
}