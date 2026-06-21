/**
 * Página de Análises
 * 
 * @author Manus AI
 * @version 2.3.1
 */

import api from '../services/api';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, BarElement, Tooltip, Legend);

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  isExtra?: boolean;
}

export default function Analytics() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${year}-${month}`);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadData();
    }
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      // Buscamos com um limite alto para garantir que todas as despesas venham para o filtro local
      const [expRes, monthRes] = await Promise.all([
        api.get('/api/expenses?limit=1000'),
        api.get(`/api/monthly-balance/${year}/${month}`),
      ]);
      setExpenses(expRes.data.data);
      setMonthlyData(monthRes?.data?.data || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
    }
    return months;
  };

  const filteredExpenses = expenses.filter(exp => exp.expenseDate.substring(0, 7) === selectedMonth);

  // Cálculos locais (Diferenciando extras)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const regularExpensesTotal = filteredExpenses.filter(e => !e.isExtra).reduce((sum, exp) => sum + exp.amount, 0);
  const extraExpensesTotal = filteredExpenses.filter(e => !!e.isExtra).reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = filteredExpenses.length;

  // Dados vindos do endpoint mensal (que já aplica o offset)
  const totalCobranca = monthlyData?.totalExpenses || 0;
  const expensesByResident = monthlyData?.balances || [];
  const totalPaid = expensesByResident.reduce((sum: number, b: any) => sum + b.totalPaid, 0);
  const totalDue = expensesByResident.reduce((sum: number, b: any) => sum + b.totalDue, 0);
  const complianceRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  // Despesas por categoria
  const expensesByCategory = filteredExpenses.reduce((acc: any, exp) => {
    const existing = acc.find((e: any) => e.category === exp.category);
    if (existing) {
      existing.amount += exp.amount;
      existing.count += 1;
    } else {
      acc.push({ category: exp.category, amount: exp.amount, count: 1 });
    }
    return acc;
  }, []).sort((a: any, b: any) => b.amount - a.amount);

  const categoryChartData = {
    labels: expensesByCategory.map((e: any) => e.category),
    datasets: [{
      label: 'Despesas por Categoria',
      data: expensesByCategory.map((e: any) => e.amount),
      backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
      borderColor: '#FFFFFF',
      borderWidth: 2,
    }],
  };

  const residentChartData = {
    labels: expensesByResident.map((b: any) => b.nickname),
    datasets: [{
      label: 'Saldo Restante',
      data: expensesByResident.map((b: any) => b.remainingBalance),
      backgroundColor: expensesByResident.map((b: any) => b.remainingBalance > 0 ? '#EF4444' : '#10B981'),
      borderColor: '#FFFFFF',
      borderWidth: 2,
    }],
  };

  const bgClass = 'bg-white';
  const textClass = 'text-gray-900';
  const borderClass = 'border-gray-200';
  const inputClass = 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-3xl font-bold ${textClass}`}>Análises</h1>
          <p className="text-gray-600 mt-2">Estatísticas e insights da república</p>
        </div>
        <div className="w-48">
          <label className={`block text-sm font-medium ${textClass} mb-2`}>Mês</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}>
            {getAvailableMonths().map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded"><p className="text-red-700">{error}</p></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass}`}>
              <p className="text-sm text-gray-600">Total Cadastrado no Mês</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">R$ {totalExpenses.toFixed(2)}</p>
              <p className="text-xs mt-1 text-gray-500">Comuns: R$ {regularExpensesTotal.toFixed(2)} | Extras: R$ {extraExpensesTotal.toFixed(2)}</p>
            </div>
            <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass}`}>
              <p className="text-sm text-gray-600">Total Cobrado (Divisão)</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">R$ {totalCobranca.toFixed(2)}</p>
              <p className="text-xs mt-1 text-gray-500">Inclui extras do mês anterior</p>
            </div>
            <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass}`}>
              <p className="text-sm text-gray-600">Adimplência</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{complianceRate.toFixed(0)}%</p>
            </div>
            <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass}`}>
              <p className="text-sm text-gray-600">Qtd. Despesas</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{expenseCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass}`}>
              <h2 className={`text-lg font-semibold ${textClass} mb-4`}>Despesas por Categoria (Cadastradas no Mês)</h2>
              <Pie data={categoryChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#374151' } } } }} />
            </div>
            <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass}`}>
              <h2 className={`text-lg font-semibold ${textClass} mb-4`}>Saldo Devedor por Morador</h2>
              <Bar data={residentChartData} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#374151' } }, y: { ticks: { color: '#374151' } } } }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
