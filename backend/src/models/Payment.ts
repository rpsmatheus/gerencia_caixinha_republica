import { v4 as uuidv4 } from 'uuid';

export interface IPayment {
    id: string;
    residentId: string;
    month: string;           // formato: 'YYYY-MM'  ex: '2026-06'
    amount: number;
    proofUrl?: string;
    notes?: string;
    createdAt: Date;
}

export interface ICreatePaymentDTO {
    residentId: string;
    month: string;
    amount: number;
    proofUrl?: string;
    notes?: string;
}