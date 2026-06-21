//Página de Despesas - Redesenhada
 

import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import { ValueInput } from '../components/ActionButton';
import Notification from '../components/Notification';
import { usePermissions } from '../hooks/usePermissions';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  isExtra?: boolean;
  notes?: string;
  proofUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

const MONTHS_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonthNum, setSelectedMonthNum] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const { canManageExpenses, canManageCategories } = usePermissions(selectedMonth || undefined);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    isExtra: false,
  });

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    setSelectedYear(String(year));
    setSelectedMonthNum(month);
    setSelectedMonth(`${year}-${month}`);
  }, []);

  useEffect(() => {
    if (selectedYear && selectedMonthNum) {
      setSelectedMonth(`${selectedYear}-${selectedMonthNum}`);
    }
  }, [selectedYear, selectedMonthNum]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Desativado temporariamente chamadas reais para evitar erro 401
      /*
      const [expRes, catRes] = await Promise.all([
        api.get('/api/expenses?limit=1000'),
        api.get('/api/categories'),
      ]);
      setExpenses(expRes.data.data);
      setCategories(catRes.data.data);
      if (catRes.data.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: catRes.data.data[0].name }));
      }
      */

      // 2. Mock de Categorias locais para teste visual
      const mockCategories = [
        { id: 'c1', name: 'Aluguel' },
        { id: 'c2', name: 'Água / Luz' },
        { id: 'c3', name: 'Mercado' },
        { id: 'c4', name: 'Internet' }
      ];
      setCategories(mockCategories);
      
      if (!formData.category) {
        setFormData(prev => ({ ...prev, category: mockCategories[0].name }));
      }

      // 3. Mock de Despesas locais para renderizar na tabela
      setExpenses([
        {
          id: 'e1',
          description: 'Aluguel da República',
          category: 'Aluguel',
          amount: 1500.00,
          expenseDate: new Date().toISOString().split('T')[0],
          isExtra: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'e2',
          description: 'Compra do Mês',
          category: 'Mercado',
          amount: 450.50,
          expenseDate: new Date().toISOString().split('T')[0],
          isExtra: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'e3',
          description: 'Manutenção da descarga',
          category: 'Água / Luz',
          amount: 80.00,
          expenseDate: new Date().toISOString().split('T')[0],
          isExtra: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);

      setError('Modo de teste local ativo: Despesas simuladas.');
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    try {
      const res = await api.post('/api/categories', {
        name: newCategoryName,
      });
      setCategories([...categories, res.data.data]);
      setNewCategoryName('');
      setShowCategoryForm(false);
      setSuccess('Categoria adicionada!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar categoria');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      setSuccess('Categoria deletada!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar categoria');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/expenses', formData);
      setFormData({
        description: '',
        category: formData.category || (categories.length > 0 ? categories[0].name : ''),
        amount: 0,
        expenseDate: new Date().toISOString().split('T')[0],
        isExtra: false,
      });
      setShowForm(false);
      await loadData();
      setSuccess('Despesa adicionada!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar despesa');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setFormData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      isExtra: !!expense.isExtra,
    });
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpenseId) return;

    try {
      await api.put(`/api/expenses/${editingExpenseId}`, formData);
      setSuccess('Despesa atualizada!');
      setShowEditModal(false);
      setEditingExpenseId(null);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar despesa');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta despesa?')) return;

    try {
      await api.delete(`/api/expenses/${id}`);
      await loadData();
      setSuccess('Despesa deletada!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar despesa');
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const expenseMonth = exp.expenseDate.substring(0, 7);
    const categoryMatch = selectedCategory === 'all' || exp.category === selectedCategory;
    const monthMatch = selectedMonth === '' || expenseMonth === selectedMonth;
    return categoryMatch && monthMatch;
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const regularTotal = filteredExpenses.filter(e => !e.isExtra).reduce((sum, e) => sum + e.amount, 0);
  const extraTotal = filteredExpenses.filter(e => e.isExtra).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Despesas</h1>
          <p className="text-slate-500 font-medium mt-2">Gerenciar despesas compartilhadas</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="lg"
            icon="🏷"
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            disabled={!canManageCategories}
            fullWidth
          >
            Categorias
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon="+"
            onClick={() => setShowForm(!showForm)}
            disabled={!canManageExpenses}
            fullWidth
          >
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-indigo-200 transition-all">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Total Cadastrado</div>
          <div className="text-3xl font-black text-slate-900 mt-2">R$ {totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-indigo-200 transition-all">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Despesas Comuns</div>
          <div className="text-3xl font-black text-indigo-600 mt-2">R$ {regularTotal.toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-orange-200 transition-all">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Extras Cadastrados</div>
          <div className="text-3xl font-black text-orange-600 mt-2">R$ {extraTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Categoria</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Ano</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Mês</label>
          <select
            value={selectedMonthNum}
            onChange={e => setSelectedMonthNum(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
          >
            {MONTHS_LABELS.map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Tabela de Despesas */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Data</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-500 tracking-tighter">Valor</th>
                <th className="px-6 py-4 text-center text-xs font-black uppercase text-slate-500 tracking-tighter">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma despesa encontrada para este filtro.</td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{expense.description}</span>
                        {expense.isExtra && (
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-orange-100 text-orange-800 border border-orange-200 uppercase">Extra</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{new Date(expense.expenseDate).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      R$ {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        {expense.proofUrl ? (
                          <Button
                            variant="icon"
                            size="sm"
                            icon="👁"
                            onClick={() => setViewingProof(expense.proofUrl || null)}
                            title="Visualizar comprovante"
                          />
                        ) : (
                          <Button
                            variant="icon"
                            size="sm"
                            icon="📎"
                            title="Anexar comprovante (em breve)"
                            disabled
                          />
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="✎"
                          onClick={() => handleEditExpense(expense)}
                          title="Editar despesa"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon="✕"
                          onClick={() => handleDelete(expense.id)}
                          title="Deletar despesa"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {(showForm || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              {showEditModal ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
            <form onSubmit={showEditModal ? handleUpdateExpense : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                <select
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Valor</label>
                <ValueInput
                  value={formData.amount}
                  onChange={val => setFormData({ ...formData, amount: val })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isExtra"
                  checked={formData.isExtra}
                  onChange={e => setFormData({ ...formData, isExtra: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isExtra" className="text-sm font-bold text-slate-700 cursor-pointer">Marcar como Extra</label>
              </div>
              <div className="flex gap-3 pt-6">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setShowForm(false);
                    setShowEditModal(false);
                  }}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  fullWidth
                >
                  {showEditModal ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categoria */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Gerenciar Categorias</h2>
            <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova categoria..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
                />
                <Button
                  variant="primary"
                  size="md"
                  icon="+"
                  type="submit"
                />
              </div>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 border-2 border-slate-100 rounded-lg hover:border-slate-200 transition-all">
                  <span className="font-bold text-slate-900">{cat.name}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    icon="✕"
                    onClick={() => handleDeleteCategory(cat.id)}
                    title="Deletar categoria"
                  />
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowCategoryForm(false)}
              fullWidth
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Comprovante */}
      {viewingProof && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-black text-slate-900">Comprovante</h3>
              <button
                onClick={() => setViewingProof(null)}
                className="text-slate-400 hover:text-slate-900 text-2xl font-black"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <img src={viewingProof} alt="Comprovante" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
