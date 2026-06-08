
import { ResidentRepository } from '../repositories/ResidentRepository.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { PaymentRepository } from '../repositories/PaymentRepository.js';


// Instanciação global para o projeto usar
export const residentRepo = new ResidentRepository();
export const expenseRepo = new ExpenseRepository();
export const paymentRepo = new PaymentRepository();