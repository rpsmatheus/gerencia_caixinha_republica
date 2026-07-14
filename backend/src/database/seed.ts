import 'dotenv/config';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId, Db } from 'mongodb';
import { connectDatabase, disconnectDatabase, getDatabase } from '../config/database.js';
import { IResident, ResidentCategory } from '../models/Resident.js';
import { IExpense, ExpenseCategory } from '../models/Expense.js';
import { IPayment } from '../models/Payment.js';
import { IMonthlyBalance } from '../models/MonthlyBalance.js';
import { IBudget } from '../models/Budget.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { BudgetTemplateRepository } from '../repositories/BudgetTemplateRepository.js';
import {
  calculateMonthlyShare,
  computeProportionalFactor,
  daysInMonth,
  toMonthKey,
} from '../modules/monthly-balance/monthlyBalance.utils.js';

const DEFAULT_REPUBLIC_ID = 'default';

export async function runSeed(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI não definida');

  await connectDatabase(mongoUri);
  const db = getDatabase();
  const residents = db.collection<IResident>('residents');

  // Migra registros antigos que não possuem os campos de autenticação/RBAC
  const legacyPasswordHash = await argon2.hash('mudar123');
  await residents.updateMany(
    { passwordHash: { $exists: false } },
    {
      $set: {
        passwordHash: legacyPasswordHash,
        mustChangePassword: true,
        role: 'resident',
        republicId: DEFAULT_REPUBLIC_ID,
      },
    }
  );

  // Migra registros antigos que não possuem categoria
  await residents.updateMany(
    { category: { $exists: false } },
    { $set: { category: 'Morador' } }
  );

  const existingAdmin = await residents.findOne({ nickname: 'admin' });

  let adminId: ObjectId;
  if (!existingAdmin) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin';
    const passwordHash = await argon2.hash(adminPassword);

    const result = await residents.insertOne({
      nickname: 'admin',
      fullName: 'admin',
      role: 'admin',
      republicId: DEFAULT_REPUBLIC_ID,
      passwordHash,
      mustChangePassword: false,
      isActive: true,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IResident);
    adminId = result.insertedId;

    console.log(`✓ Admin criado — usuário: admin / senha: ${adminPassword}`);
  } else {
    adminId = existingAdmin._id!;
    console.log('✓ Admin já existe, seed de admin ignorado');
  }

  await seedDemoData(db, adminId);

  console.log('✓ Seed concluído');
}

/**
 * Popula a república do admin com dados de demonstração: moradores, categorias,
 * modelos de orçamento e 3 meses de despesas/pagamentos/orçamentos — incluindo
 * um mês com cálculo proporcional e um morador inativo, para exercitar todas as
 * telas do sistema. Idempotente: só roda se ainda não houver moradores de demo.
 */
async function seedDemoData(db: Db, adminId: ObjectId): Promise<void> {
  const residents = db.collection<IResident>('residents');
  const alreadySeeded = await residents.findOne({ nickname: 'joao', republicId: DEFAULT_REPUBLIC_ID });
  if (alreadySeeded) {
    console.log('✓ Dados de demonstração já existem, seed de demo ignorado');
    return;
  }

  const expenses = db.collection<IExpense>('expenses');
  const payments = db.collection<IPayment>('payments');
  const monthlyBalances = db.collection<IMonthlyBalance>('monthlyBalances');
  const budgets = db.collection<IBudget>('budgets');

  const now = new Date();
  const demoPasswordHash = await argon2.hash('mudar123');

  const demoResidents: Array<{ nickname: string; fullName: string; category: ResidentCategory }> = [
    { nickname: 'joao', fullName: 'João Silva', category: 'Morador' },
    { nickname: 'maria', fullName: 'Maria Santos', category: 'Morador' },
    { nickname: 'pedro', fullName: 'Pedro Costa', category: 'Agregado' },
    { nickname: 'ana', fullName: 'Ana Oliveira', category: 'Bixo' },
  ];

  const residentIds: Record<string, string> = {};
  for (const r of demoResidents) {
    const doc: IResident = {
      nickname: r.nickname,
      fullName: r.fullName,
      category: r.category,
      role: 'resident',
      republicId: DEFAULT_REPUBLIC_ID,
      passwordHash: demoPasswordHash,
      mustChangePassword: true,
      isActive: true,
      joinDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IResident;
    const result = await residents.insertOne(doc as any);
    residentIds[r.nickname] = String(result.insertedId);
  }

  // Categorias e modelos de orçamento — reaproveita o lazy-seed real dos
  // repositórios para garantir que ficam idênticos ao que a aplicação criaria.
  await new CategoryRepository().findAllByRepublic(DEFAULT_REPUBLIC_ID);
  const templates = await new BudgetTemplateRepository().findAllByRepublic(DEFAULT_REPUBLIC_ID);

  // Últimos 3 meses (mais antigo → atual), para os dados sempre parecerem "vivos".
  const months = [2, 1, 0].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const expenseDefs: Array<{ description: string; category: string; amounts: [number, number, number] }> = [
    { description: 'Conta de Luz', category: ExpenseCategory.UTILITIES, amounts: [165, 180, 172] },
    { description: 'Internet', category: ExpenseCategory.INTERNET, amounts: [100, 100, 110] },
    { description: 'Feira do mês', category: ExpenseCategory.FOOD, amounts: [340, 385, 360] },
    { description: 'Gás de cozinha', category: ExpenseCategory.HOUSING, amounts: [90, 85, 95] },
    { description: 'Produtos de limpeza', category: ExpenseCategory.CLEANING, amounts: [55, 62, 58] },
  ];

  // mi=0 → mês mais antigo: baseline, todos em mês cheio.
  // mi=1 → pedro sai no meio do mês (cálculo proporcional).
  // mi=2 (atual) → ana fica inativa (fora da caixinha deste mês).
  const previousBalance: Record<string, number> = { joao: 0, maria: 0, pedro: 0, ana: 0 };

  for (let mi = 0; mi < months.length; mi++) {
    const { year, month } = months[mi];
    const totalDays = daysInMonth(year, month);
    const monthKey = toMonthKey(year, month);

    const monthExpenses: IExpense[] = expenseDefs.map((def) => ({
      userId: String(adminId),
      republicId: DEFAULT_REPUBLIC_ID,
      description: def.description,
      category: def.category,
      amount: def.amounts[mi],
      expenseDate: new Date(year, month - 1, 10 + mi),
      notes: undefined,
      proofUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await expenses.insertMany(monthExpenses as any);

    const overrides: Record<string, { isActive: boolean; exitDay: number | null }> = {
      joao: { isActive: true, exitDay: null },
      maria: { isActive: true, exitDay: null },
      pedro: { isActive: true, exitDay: mi === 1 ? 15 : null },
      ana: { isActive: mi === 2 ? false : true, exitDay: null },
    };

    const proportionalFactor: Record<string, number> = {};
    for (const nick of Object.keys(overrides)) {
      proportionalFactor[nick] = computeProportionalFactor(overrides[nick].exitDay, totalDays);
    }
    const totalWeight = Object.keys(overrides)
      .filter((nick) => overrides[nick].isActive)
      .reduce((sum, nick) => sum + proportionalFactor[nick], 0);
    const monthlyShare = calculateMonthlyShare(monthExpenses, totalWeight);

    // Fração do total devido que cada morador paga neste mês — usado para
    // criar variedade realista (débito, crédito, quitação em dia).
    const paymentRatio: Record<string, number> = {
      joao: 1,
      maria: mi === 1 ? 1.15 : 1,
      pedro: mi === 0 ? 0.7 : 1,
      ana: 1,
    };

    for (const nick of Object.keys(overrides)) {
      const { isActive, exitDay } = overrides[nick];
      const factor = proportionalFactor[nick];
      const currentMonthDue = isActive ? monthlyShare * factor : 0;
      const prevBalance = previousBalance[nick];
      const totalDue = prevBalance + currentMonthDue;

      const payAmount = Math.round(totalDue * paymentRatio[nick] * 100) / 100;
      let totalPaid = 0;
      if (payAmount > 0) {
        const paymentDoc: IPayment = {
          id: uuidv4(),
          residentId: residentIds[nick],
          month: monthKey,
          amount: payAmount,
          createdAt: new Date(year, month - 1, 20 + mi),
        };
        await payments.insertOne(paymentDoc as any);
        totalPaid = payAmount;
      }

      const remainingBalance = Math.round((totalDue - totalPaid) * 100) / 100;

      const balanceDoc: IMonthlyBalance = {
        id: uuidv4(),
        residentId: residentIds[nick],
        year,
        month,
        previousBalance: prevBalance,
        monthlyShare: currentMonthDue,
        totalDue,
        amountPaid: totalPaid,
        currentBalance: remainingBalance,
        isActive,
        exitDay,
        proportionalFactor: factor,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await monthlyBalances.insertOne(balanceDoc as any);

      previousBalance[nick] = remainingBalance;
    }

    const monthBudgets: IBudget[] = templates.map((t, idx) => ({
      id: uuidv4(),
      republicId: DEFAULT_REPUBLIC_ID,
      year,
      month,
      description: t.description,
      category: t.category,
      amount: t.amount + mi * 5,
      isApplied: mi === 0 && idx === 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await budgets.insertMany(monthBudgets as any);
  }

  console.log('✓ Dados de demonstração criados: 4 moradores, 3 meses de despesas/pagamentos/orçamentos');
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  runSeed()
    .catch((error) => {
      console.error('✗ Erro ao rodar seed:', error);
      process.exitCode = 1;
    })
    .finally(() => disconnectDatabase());
}
