/**
 * Página de Caixinha Mensal - Redesenhada
 * 
 * @author Manus AI
 * @version 2.5.0
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import Notification from '../components/Notification';
import ResidentBalanceCard from '../components/ResidentBalanceCard';
import { usePermissions } from '../hooks/usePermissions';

interface Payment {
  id: string;
  residentId: string;
  month: string;
  amount: number;
  proofUrl: string | null;
  createdAt: string;
}

interface MonthlyBalance {
  residentId: string;
  residentName: string;
  nickname: string;
  totalExpenses: number;
  perPersonAmount: number;
  month: string;
  isActive: boolean;
  exitDay: number | null;
  proportionalFactor: number;
  payments: Payment[];
  totalPaid: number;
  previousBalance: number;
  currentMonthDue: number;
  totalDue: number;
  remainingBalance: number;
}

interface MonthlyData {
  month: string;
  totalExpenses: number;
  activeResidents: number;
  perPersonAmount: number;
  balances: MonthlyBalance[];
  expenses: any[];
  manager: { residentId: string; residentName: string } | null;
}

const MONTHS_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthlyDashboard() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonthNum, setSelectedMonthNum] = useState<string>('');
  const [selectedResident, setSelectedResident] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  const { canManagePayments, canManageResidents } = usePermissions(selectedMonth || undefined);

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
    if (selectedMonth) {
      loadMonthlyData();
    }
  }, [selectedMonth, statusFilter, selectedResident]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const response = await api.get(`/api/monthly-balance/${year}/${month}`);
      setMonthlyData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados mensais');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResident = async (residentId: string, currentStatus: boolean) => {
    try {
      const [year, month] = selectedMonth.split('-');
      const newStatus = !currentStatus;
      await api.put(`/api/monthly-balance/${year}/${month}/${residentId}/status`, { isActive: newStatus });
      setSuccess(`Morador ${newStatus ? 'ativado' : 'desativado'}!`);
      await loadMonthlyData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSetProportional = async (residentId: string, exitDay: number | null) => {
    try {
      const [year, month] = selectedMonth.split('-');
      if (exitDay === null) {
        await api.delete(`/api/monthly-balance/${year}/${month}/${residentId}/proportional`);
        setSuccess('Cálculo proporcional removido. Morador voltou ao mês completo.');
      } else {
        await api.put(`/api/monthly-balance/${year}/${month}/${residentId}/proportional`, { exitDay });
        setSuccess(`Cálculo proporcional definido: dia ${exitDay} de saída.`);
      }
      await loadMonthlyData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao definir proporcional');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleRegisterPayment = async (residentId: string, amount: number) => {
    if (isNaN(amount) || amount === 0) {
      setError('Digite um valor válido');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      const [year, month] = selectedMonth.split('-');
      await api.post(`/api/monthly-balance/${year}/${month}/${residentId}/payment`, { amount });
      setSuccess(`Lançamento de R$ ${amount.toFixed(2)} registrado!`);
      await loadMonthlyData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar lançamento');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este lançamento?')) return;
    try {
      await api.delete(`/api/monthly-balance/payment/${paymentId}`);
      setSuccess('Lançamento deletado!');
      await loadMonthlyData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar lançamento');
      setTimeout(() => setError(null), 3000);
    }
  };

  let filteredBalances = monthlyData?.balances || [];
  if (statusFilter === 'active') filteredBalances = filteredBalances.filter(b => b.isActive);
  else if (statusFilter === 'inactive') filteredBalances = filteredBalances.filter(b => !b.isActive);
  if (selectedResident !== 'all') filteredBalances = filteredBalances.filter(b => b.residentId === selectedResident);

  const residents = monthlyData?.balances || [];
  const activeResidentsCount = residents.filter(r => r.isActive).length;
  const inactiveResidentsCount = residents.filter(r => !r.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Caixinha Mensal</h1>
        <p className="text-slate-500 font-medium mt-2">Divisão automática de despesas entre moradores</p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Ano</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold">
            {[2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Mês</label>
          <select value={selectedMonthNum} onChange={e => setSelectedMonthNum(e.target.value)} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold">
            {MONTHS_LABELS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Morador</label>
          <select value={selectedResident} onChange={e => setSelectedResident(e.target.value)} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold">
            <option value="all">Todos</option>
            {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.residentName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-bold">
            <option value="active">Ativos ({activeResidentsCount})</option>
            <option value="inactive">Inativos ({inactiveResidentsCount})</option>
            <option value="all">Todos ({residents.length})</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {monthlyData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-indigo-200 transition-all">
            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Total do Mês</div>
            <div className="text-3xl font-black text-indigo-600 mt-2">R$ {monthlyData.totalExpenses.toFixed(2)}</div>
            <p className="text-[10px] text-slate-400 font-bold mt-2">Despesas do mês</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-lg border-2 border-green-500 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-3xl opacity-10">👥</div>
            <div className="text-green-800 text-xs font-black uppercase tracking-widest">Valor por Pessoa</div>
            <div className="text-3xl font-black text-green-700 mt-2">R$ {monthlyData.perPersonAmount.toFixed(2)}</div>
            <p className="text-[10px] text-green-600 font-bold mt-2">{monthlyData.activeResidents} moradores ativos</p>
          </div>
        </div>
      )}

      {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Balances */}
      {!loading && filteredBalances.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-1 h-8 bg-purple-600 rounded-full"></span>
            Status de Pagamentos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBalances.map(balance => (
              <ResidentBalanceCard
                key={balance.residentId}
                residentName={balance.residentName}
                nickname={balance.nickname}
                isActive={balance.isActive}
                exitDay={balance.exitDay ?? null}
                proportionalFactor={balance.proportionalFactor ?? 1}
                previousBalance={balance.previousBalance}
                currentMonthDue={balance.currentMonthDue}
                totalDue={balance.totalDue}
                totalPaid={balance.totalPaid}
                remainingBalance={balance.remainingBalance}
                payments={balance.payments}
                darkMode={false}
                onToggleStatus={canManageResidents ? () => handleToggleResident(balance.residentId, balance.isActive) : undefined}
                onDeletePayment={canManagePayments ? handleDeletePayment : undefined}
                onRegisterPayment={canManagePayments ? (amount: number) => handleRegisterPayment(balance.residentId, amount) : undefined}
                onSetProportional={canManageResidents ? (exitDay: number | null) => handleSetProportional(balance.residentId, exitDay) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {!loading && monthlyData && monthlyData.expenses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-1 h-8 bg-amber-600 rounded-full"></span>
            Despesas de {MONTHS_LABELS[parseInt(selectedMonthNum)-1]}/{selectedYear}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-tighter">Data</th>
                    <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-500 tracking-tighter">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900">{expense.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{expense.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-bold">{new Date(expense.expenseDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        R$ {expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
