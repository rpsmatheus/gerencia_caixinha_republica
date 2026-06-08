/**
 * Configuração do MongoDB
 * 
 * Gerencia a conexão com o banco de dados MongoDB.
 * Implementa padrão Singleton para garantir uma única conexão.
 * 
 */

import { MongoClient, Db } from 'mongodb';
import type { Collection } from 'mongodb';

/**
 * Classe para gerenciar conexão com MongoDB
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  /**
   * Construtor privado para implementar Singleton
   */
  private constructor() { }

  /**
   * Obtém instância única da classe
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Conecta ao MongoDB
   * 
   * @param mongoUri - URI de conexão do MongoDB
   * @returns Instância do banco de dados
   * 
   * @throws Error se a conexão falhar
   */
  async connect(mongoUri: string): Promise<Db> {
    if (this.db) {
      console.log('✓ Usando conexão existente com MongoDB');
      return this.db;
    }

    try {
      console.log('🔄 Conectando ao MongoDB...');
      this.client = new MongoClient(mongoUri);
      await this.client.connect();

      this.db = this.client.db('caixinha');

      // Verificar conexão
      await this.db.admin().ping();
      console.log('✓ Conectado ao MongoDB com sucesso');

      return this.db;
    } catch (error) {
      console.error('✗ Erro ao conectar ao MongoDB:', error);
      throw error;
    }
  }

  /**
   * Obtém instância do banco de dados
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado. Chame connect() primeiro.');
    }
    return this.db;
  }

  /**
   * Desconecta do MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('✓ Desconectado do MongoDB');
    }
  }

  /**
   * Cria índices nas coleções
   */
  async createIndexes(): Promise<void> {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado');
    }

    console.log('🔄 Criando índices...');

    try {
      // Índices para Residents
      const residentsCollection = this.db.collection('residents');
      await residentsCollection.createIndex({ nickname: 1 }, { unique: true });
      await residentsCollection.createIndex({ isActive: 1 });
      await residentsCollection.createIndex({ createdAt: -1 });

      // Índices para Expenses
      const expensesCollection = this.db.collection('expenses');
      await expensesCollection.createIndex({ expenseDate: -1 });
      await expensesCollection.createIndex({ category: 1 });
      await expensesCollection.createIndex({ isExtra: 1 });
      await expensesCollection.createIndex({ createdAt: -1 });

      // Índices para MonthlyBalances
      const balancesCollection = this.db.collection('monthlyBalances');
      await balancesCollection.createIndex({ residentId: 1, year: 1, month: 1 }, { unique: true });
      await balancesCollection.createIndex({ year: 1, month: 1 });
      await balancesCollection.createIndex({ createdAt: -1 });

      console.log('✓ Índices criados com sucesso');
    } catch (error) {
      console.error('✗ Erro ao criar índices:', error);
      throw error;
    }
  }

  /**
   * Limpa o banco de dados (apenas para desenvolvimento)
   */
  async clearDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado');
    }

    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Limpeza de banco de dados apenas permitida em desenvolvimento');
    }

    console.log('⚠️  Limpando banco de dados...');

    try {
      await this.db.dropDatabase();
      console.log('✓ Banco de dados limpo');
    } catch (error) {
      console.error('✗ Erro ao limpar banco de dados:', error);
      throw error;
    }
  }
}

/**
 * Função auxiliar para obter instância do banco
 */
export function getDatabase(): Db {
  return DatabaseConnection.getInstance().getDatabase();
}

/**
 * Função auxiliar para conectar ao banco
 */
export async function connectDatabase(mongoUri: string): Promise<Db> {
  return DatabaseConnection.getInstance().connect(mongoUri);
}

/**
 * Função auxiliar para desconectar do banco
 */
export async function disconnectDatabase(): Promise<void> {
  return DatabaseConnection.getInstance().disconnect();
}

