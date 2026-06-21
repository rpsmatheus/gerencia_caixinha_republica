/**
 * Página de Orçamentos Mensais
 * 
 * @author Manus AI
 * @version 2.5.0
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import Notification from '../components/Notification';

interface Budget {
  id: string;
  month: string;
  description: string;
  amount: number;
  category: string;
  isApplied: boolean;
}

interface Extra {
  id: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
}

interface BudgetData {
  budgets: Budget[];
  extras: Extra[];
  extrasTotal: number;
  budgetsTotal: number;
  totalWithExtras: number;
  activeResidents: number;
  perPersonDivision: number;
}

const MONTHS_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Budgets() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMonthNum, setSelectedMonthNum] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  useEffect(() => {
    loadBudgetData();
  }, [selectedYear, selectedMonthNum]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/budgets/${selectedYear}/${selectedMonthNum}`);
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      await api.post(`/api/budgets/simulate/${selectedYear}/${selectedMonthNum}`);
      setSuccess('Orçamentos simulados com sucesso!');
      loadBudgetData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao simular orçamentos');
    }
  };

  const handleApply = async (id: string) => {
    try {
      await api.post(`/api/budgets/${id}/apply`);
      setSuccess('Orçamento aplicado como despesa real!');
      loadBudgetData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao aplicar orçamento');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/api/budgets/${id}`, { amount: parseFloat(editAmount) });
      setSuccess('Valor atualizado!');
      setEditingId(null);
      loadBudgetData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar valor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este orçamento?')) return;
    try {
      await api.delete(`/api/budgets/${id}`);
      setSuccess('Orçamento deletado!');
      loadBudgetData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar orçamento');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Orçamentos Mensais</h1>
          <p className="text-slate-500 font-medium mt-2">Simule e planeje os gastos da república</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon="📊"
          onClick={handleSimulate}
          className="w-full sm:w-auto"
        >
          Simular Mês Padrão
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Ano</label>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)} 
            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Mês</label>
          <select 
            value={selectedMonthNum} 
            onChange={e => setSelectedMonthNum(e.target.value)} 
            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold"
          >
            {MONTHS_LABELS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
          </select>
        </div>
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-indigo-200 transition-all">
            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Orçamentos</div>
            <div className="text-3xl font-black text-indigo-600 mt-2">R$ {data.budgetsTotal.toFixed(2)}</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-orange-200 transition-all">
            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Extras Anterior</div>
            <div className="text-3xl font-black text-orange-600 mt-2">R$ {data.extrasTotal.toFixed(2)}</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-all">
            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Total Previsto</div>
            <div className="text-3xl font-black text-slate-900 mt-2">R$ {data.totalWithExtras.toFixed(2)}</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-lg border-2 border-green-500 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-3xl opacity-10">💰</div>
            <div className="text-green-800 text-xs font-black uppercase tracking-widest">Divisão por Pessoa</div>
            <div className="text-3xl font-black text-green-700 mt-2">R$ {data.perPersonDivision.toFixed(2)}</div>
            <div className="text-[10px] text-green-600 font-bold mt-2">👥 {data.activeResidents} moradores ativos</div>
          </div>
        </div>
      )}

      {/* Orçamentos List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <span className="w-1 h-8 bg-indigo-600 rounded-full"></span>
          Gastos Orçados
        </h2>
        
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Descrição</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Categoria</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-500 tracking-tighter">Valor</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase text-slate-500 tracking-tighter">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Carregando...</td></tr>
                ) : data?.budgets.map(b => (
                  <tr key={b.id} className={`hover:bg-slate-50 transition-colors ${b.isApplied ? 'bg-green-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{b.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{b.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      {editingId === b.id ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-32 px-3 py-2 border-2 border-indigo-300 rounded-lg text-right focus:outline-none bg-white"
                          autoFocus
                        />
                      ) : (
                        `R$ ${b.amount.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        {editingId === b.id ? (
                          <Button 
                            variant="success" 
                            size="sm" 
                            icon="✓" 
                            onClick={() => handleUpdate(b.id)} 
                          />
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            icon="✎" 
                            onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)); }} 
                          />
                        )}
                        
                        {!b.isApplied ? (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            icon="✓" 
                            onClick={() => handleApply(b.id)} 
                            title="Aplicar como despesa real"
                          />
                        ) : (
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-black rounded-lg border border-green-200">APLICADO</span>
                        )}
                        
                        <Button 
                          variant="danger" 
                          size="sm" 
                          icon="✕" 
                          onClick={() => handleDelete(b.id)} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && data?.budgets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      Nenhum orçamento para este mês.<br/>
                      <button onClick={handleSimulate} className="text-indigo-600 font-black mt-2 hover:underline">Simular Mês Padrão agora?</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
