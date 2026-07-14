import 'dotenv/config';
import argon2 from 'argon2';
import { connectDatabase, disconnectDatabase, getDatabase } from '../config/database.js';
import { IResident } from '../models/Resident.js';

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

  if (!existingAdmin) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const passwordHash = await argon2.hash(adminPassword);

    await residents.insertOne({
      nickname: 'admin',
      fullName: 'Administrador',
      category: 'Morador',
      role: 'admin',
      republicId: DEFAULT_REPUBLIC_ID,
      passwordHash,
      mustChangePassword: false,
      isActive: true,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IResident);

    console.log(`✓ Admin criado — nickname: admin / senha: ${adminPassword}`);
  } else {
    console.log('✓ Admin já existe, seed de admin ignorado');
  }

  console.log('✓ Seed concluído');
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
