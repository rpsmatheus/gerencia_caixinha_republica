import { v4 as uuidv4 } from 'uuid';
import { IPayment, ICreatePaymentDTO } from '../models/Payment.js';

export class PaymentFactory {
    static create(data: ICreatePaymentDTO): IPayment {
        if (!data.residentId?.trim()) throw new Error('residentId obrigatório');
        if (!data.amount || data.amount <= 0) throw new Error('amount inválido');
        if (!data.month?.match(/^\d{4}-\d{2}$/)) throw new Error('month deve ser YYYY-MM');
        return {
            id: uuidv4(),
            residentId: data.residentId,
            month: data.month,
            amount: data.amount,
            proofUrl: data.proofUrl,
            notes: data.notes,
            createdAt: new Date(),
        };
    }
}