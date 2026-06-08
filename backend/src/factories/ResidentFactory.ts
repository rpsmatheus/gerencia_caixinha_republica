import { IResident, ICreateResidentDTO } from '../models/Resident.js';

export class ResidentFactory {
  static create(data: any) {
    if (!data.fullName) throw new Error("fullName obrigatório");
    if (!data.nickname) throw new Error("nickname obrigatório");
    if (!data.republicId) throw new Error("republicId obrigatório");

    return {
      fullName: data.fullName,
      nickname: data.nickname,
      republicId: data.republicId,
      role: "resident" as const,
      isActive: true,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}