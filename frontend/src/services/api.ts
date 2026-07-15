/**
 * Serviço de API
 *
 * Centraliza todas as chamadas à API backend.
 * Utiliza axios para requisições HTTP.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = ((import.meta as any).env?.VITE_API_URL) || 'http://localhost:3001';

const TOKEN_KEY = 'caixinha_token';

/**
 * Instância do axios com configurações padrão
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de request: injeta Bearer token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de response: em 401 limpa sessão, em 403 lança erro ─────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Limpar sessão e redirecionar para login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('caixinha_resident');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } else if (error.response?.status === 403) {
      // Não deslogar — apenas propagar o erro com mensagem amigável
      const apiError = new Error('Você não tem permissão para executar esta ação.') as any;
      apiError.status = 403;
      apiError.original = error;
      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResident {
  id: string;
  nickname: string;
  fullName: string;
  phone?: string | null;
  category?: string;
  role: 'resident' | 'admin';
  isActive: boolean;
  mustChangePassword: boolean;
}

export async function apiLogin(
  identifier: string,
  password: string
): Promise<{ accessToken: string; resident: AuthResident }> {
  const res = await api.post('/api/auth/login', { identifier, password });
  return res.data.data;
}

export async function apiRegister(
  nickname: string,
  password: string
): Promise<{ accessToken: string; resident: AuthResident }> {
  const res = await api.post('/api/auth/register', { nickname, password });
  return res.data.data;
}

export async function apiLogout(): Promise<void> {
  await api.post('/api/auth/logout');
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.post('/api/auth/change-password', { currentPassword, newPassword });
}

export async function apiMe(): Promise<AuthResident> {
  const res = await api.get('/api/auth/me');
  return res.data.data.resident;
}

/**
 * Tipos para Residents
 */
export interface Resident {
  id: string;
  nickname: string;
  fullName: string;
  whatsappNumber?: string;
  isActive: boolean;
  role: 'resident' | 'admin';
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResidentDTO {
  nickname: string;
  fullName: string;
  whatsappNumber?: string;
}

/**
 * Tipos para Expenses
 */
export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  hasProof: boolean;
  proofOriginalName?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDTO {
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}

/**
 * Resposta paginada genérica
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * API de Residents
 */
export const residentAPI = {
  /**
   * Lista todos os residents
   */
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Resident>> {
    const response = await api.get('/api/residents', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Busca residents com filtros
   */
  async search(
    search?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Resident>> {
    const response = await api.get('/api/residents/search', {
      params: { search, isActive, page, limit },
    });
    return response.data;
  },

  /**
   * Obtém um resident por ID
   */
  async getById(id: string): Promise<{ success: boolean; data: Resident }> {
    const response = await api.get(`/api/residents/${id}`);
    return response.data;
  },

  /**
   * Cria um novo resident
   */
  async create(data: CreateResidentDTO): Promise<{ success: boolean; data: Resident }> {
    const response = await api.post('/api/residents', data);
    return response.data;
  },

  /**
   * Atualiza um resident
   */
  async update(
    id: string,
    data: Partial<CreateResidentDTO>
  ): Promise<{ success: boolean; data: Resident }> {
    const response = await api.put(`/api/residents/${id}`, data);
    return response.data;
  },

  /**
   * Deleta um resident
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/residents/${id}`);
    return response.data;
  },

  /**
   * Ativa um resident
   */
  async activate(id: string): Promise<{ success: boolean; data: Resident }> {
    const response = await api.patch(`/api/residents/${id}/activate`);
    return response.data;
  },

  /**
   * Desativa um resident
   */
  async deactivate(id: string): Promise<{ success: boolean; data: Resident }> {
    const response = await api.patch(`/api/residents/${id}/deactivate`);
    return response.data;
  },

  /**
   * Obtém estatísticas
   */
  async getStats(): Promise<{
    success: boolean;
    data: { total: number; active: number; inactive: number };
  }> {
    const response = await api.get('/api/residents/stats');
    return response.data;
  },
};

export const expenseAPI = {
  /**
   * Lista todas as despesas
   */
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Expense>> {
    const response = await api.get('/api/expenses', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Obtém uma despesa por ID
   */
  async getById(id: string): Promise<{ success: boolean; data: Expense }> {
    const response = await api.get(`/api/expenses/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova despesa
   */
  async create(data: CreateExpenseDTO): Promise<{ success: boolean; data: Expense }> {
    const response = await api.post('/api/expenses', data);
    return response.data;
  },

  /**
   * Atualiza uma despesa
   */
  async update(
    id: string,
    data: Partial<CreateExpenseDTO>
  ): Promise<{ success: boolean; data: Expense }> {
    const response = await api.put(`/api/expenses/${id}`, data);
    return response.data;
  },

  /**
   * Deleta uma despesa
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/expenses/${id}`);
    return response.data;
  },
};

export default api;

