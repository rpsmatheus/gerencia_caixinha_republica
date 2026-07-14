import { ObjectId } from 'mongodb';

/**
 * Modelo de Resident (Morador)
 * 
 * Este arquivo define as interfaces e tipos para o modelo de Resident.
 * Utilizamos interfaces TypeScript para garantir type safety em toda a aplicação.
 */

/**
 * Define os papéis possíveis de um usuário no sistema.
 *
 * - admin: pode gerenciar moradores, despesas e configurações do sistema
 * - resident: acesso limitado, apenas visualização e ações próprias
 */
export type Role = 'admin' | 'resident';

/**
 * Categoria do morador dentro da república
 */
export type ResidentCategory = 'Bixo' | 'Agregado' | 'Morador';

/**
 * Interface que representa um Morador no banco de dados
 * Contém todos os dados persistidos de um morador
 */
export interface IResident {
  /** id do mongo: _id*/
  _id?: ObjectId;
  
  /** Apelido/username do morador (deve ser único) */
  nickname: string;
  
  /** Nome completo do morador */
  fullName: string;
  
  /** Número de WhatsApp (opcional) */
  whatsappNumber?: string;

  /** Categoria do morador na república */
  category: ResidentCategory;

  /** Indica se o morador está ativo no sistema */
  isActive: boolean;

  /** Define os papéis possíveis de um usuário no sistema */
  role: Role;

  /** Hash argon2 da senha do morador */
  passwordHash: string;

  /** Se true, o morador é obrigado a trocar a senha no próximo login */
  mustChangePassword: boolean;

  /** Identifica a república à qual o morador pertence (multi-tenancy) */
  republicId: string;

  /** Data em que o morador entrou na república */
  joinDate: Date;
  
  /** Data de criação do registro */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}

/**
 * DTO (Data Transfer Object) para criação de um novo Resident
 * Contém apenas os dados necessários para criar um morador
 */
export interface ICreateResidentDTO {
  /** Apelido/username do morador */
  nickname: string;

  /** Nome completo do morador */
  fullName: string;

  /** Número de WhatsApp (opcional) */
  whatsappNumber?: string;

  /** Categoria do morador na república (padrão: Bixo) */
  category?: ResidentCategory;

  /** Senha inicial em texto puro (será convertida em passwordHash). Se omitida, uma senha temporária é gerada. */
  password?: string;

  /** Identifica a república à qual o morador pertence */
  republicId: string;
}

/**
 * DTO para atualização de um Resident
 * Todos os campos são opcionais para permitir atualizações parciais
 */
export interface IUpdateResidentDTO {
  /** Novo apelido (opcional) */
  nickname?: string;
  
  /** Novo nome completo (opcional) */
  fullName?: string;
  
  /** Novo número de WhatsApp (opcional) */
  whatsappNumber?: string;

  /** Nova categoria (opcional) */
  category?: ResidentCategory;

  /** Novo status de atividade (opcional) */
  isActive?: boolean;
}

/**
 * Interface para filtros de busca de Residents
 * Permite buscar moradores com critérios específicos
 */
export interface IResidentFilter {
  /** Filtrar por status de atividade */
  isActive?: boolean;
  
  /** Filtrar por data de entrada (após esta data) */
  joinDateAfter?: Date;
  
  /** Filtrar por data de entrada (antes desta data) */
  joinDateBefore?: Date;
  
  /** Buscar por nome ou apelido (busca parcial) */
  search?: string;
}

/**
 * Interface para resposta paginada de Residents
 */
export interface IResidentPaginatedResponse {
  /** Lista de moradores */
  data: IResident[];
  
  /** Total de registros encontrados */
  total: number;
  
  /** Página atual */
  page: number;
  
  /** Quantidade de registros por página */
  limit: number;
  
  /** Total de páginas */
  totalPages: number;
}
