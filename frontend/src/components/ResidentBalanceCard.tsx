/**
 * Componente de Card de Saldo do Morador
 * 
 * Design limpo e elegante com informações principais em destaque
 * e detalhes em accordion colapsável.
 * 
 * Funcionalidades:
 * - Toggle on/off estilo switch para ativar/inativar morador
 * - Animação de slide-out ao inativar (card desliza para direita e some)
 * - Botão "Proporcional" para definir dia de saída e recalcular cota
 * - Botões de anexar/visualizar comprovante para pagamentos
 * 
 * @author Manus AI
 * @version 2.5.0
 */

import { useState, useEffect } from 'react';
import Button from './Button';

interface Payment {
  id: string;
  residentId: string;
  month: string;
  amount: number;
  proofUrl: string | null;
  createdAt: string;
}

interface ResidentBalanceCardProps {
  residentName: string;
  nickname: string;
  isActive: boolean;
  exitDay: number | null;
  proportionalFactor: number;
  previousBalance: number;
  currentMonthDue: number;
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  payments: Payment[];
  darkMode: boolean;
  onToggleStatus?: () => void;
  onDeletePayment?: (paymentId: string) => void;
  onRegisterPayment?: (amount: number) => void;
  onSetProportional?: (exitDay: number | null) => void;
}

export default function ResidentBalanceCard({
  residentName,
  nickname,
  isActive,
  exitDay,
  proportionalFactor,
  previousBalance,
  currentMonthDue,
  totalDue,
  totalPaid,
  remainingBalance,
  payments,
  onToggleStatus,
  onDeletePayment,
  onRegisterPayment,
  onSetProportional,
}: ResidentBalanceCardProps) {
  const [expandedPayments, setExpandedPayments] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [showProportionalModal, setShowProportionalModal] = useState(false);
  const [exitDayInput, setExitDayInput] = useState<string>(exitDay ? String(exitDay) : '');
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  useEffect(() => {
    setExitDayInput(exitDay ? String(exitDay) : '');
  }, [exitDay]);

  const isDebt = remainingBalance > 0;
  const statusLabel = isDebt ? 'Débito' : 'Crédito';
  const statusColor = isDebt ? 'text-red-600' : 'text-green-600';

  const hasProportional = exitDay !== null && exitDay !== undefined && exitDay > 0;
  const proportionalPercent = hasProportional ? Math.round(proportionalFactor * 100) : 100;

  const handleToggle = () => {
    if (!onToggleStatus) return;
    if (isActive) {
      setIsExiting(true);
      setTimeout(() => {
        setIsExiting(false);
        onToggleStatus();
      }, 420);
    } else {
      onToggleStatus();
    }
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!isNaN(amount) && amount !== 0) {
      onRegisterPayment?.(amount);
      setPaymentAmount('');
      setShowPaymentForm(false);
    }
  };

  const handleSaveProportional = () => {
    const trimmed = exitDayInput.trim();
    if (!trimmed) {
      onSetProportional?.(null);
      setShowProportionalModal(false);
      return;
    }
    const day = parseInt(trimmed);
    if (isNaN(day) || day < 1 || day > 31) return;
    onSetProportional?.(day);
    setShowProportionalModal(false);
  };

  const handleClearProportional = () => {
    setExitDayInput('');
    onSetProportional?.(null);
    setShowProportionalModal(false);
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 border-slate-100 hover:shadow-lg hover:border-slate-200 overflow-hidden transition-all duration-300 ${
        isExiting ? 'animate-slide-out-right' : ''
      }`}
    >
      {/* ===== HEADER ===== */}
      <div className="p-5 pb-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-slate-700">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-lg truncate leading-tight">{residentName}</h3>
            <p className="text-sm text-slate-300 truncate">@{nickname}</p>
          </div>

          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
            {onToggleStatus && (
            <button
              onClick={handleToggle}
              title={isActive ? 'Clique para inativar este morador neste mês' : 'Clique para ativar este morador neste mês'}
              aria-label={isActive ? 'Desativar morador' : 'Ativar morador'}
              className={`toggle-switch focus:ring-offset-slate-900 ${
                isActive
                  ? 'bg-green-400 focus:ring-green-300'
                  : 'bg-gray-500 focus:ring-gray-400'
              }`}
            >
              <span
                className={`toggle-switch-thumb ${
                  isActive ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            )}
            <span className={`text-[10px] font-black tracking-wide ${isActive ? 'text-green-300' : 'text-gray-400'}`}>
              {isActive ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div className="mt-3">
          {onSetProportional && (
          <button
            onClick={() => setShowProportionalModal(!showProportionalModal)}
            title="Definir cálculo proporcional por dias de permanência no mês"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all duration-200 ${
              hasProportional
                ? 'bg-amber-400 text-amber-900 hover:bg-amber-300 shadow-md'
                : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
            }`}
          >
            <span>⚖</span>
            <span>Proporcional</span>
            {hasProportional && (
              <span className="ml-0.5 bg-amber-900 text-amber-100 rounded-full px-2 py-0.5 text-[9px] font-black">
                {proportionalPercent}%
              </span>
            )}
          </button>
          )}
        </div>
      </div>

      {/* ===== MODAL PROPORCIONAL ===== */}
      {showProportionalModal && (
        <div className="px-5 py-4 bg-amber-50 border-b-2 border-amber-200 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-amber-900">⚖ Cálculo Proporcional</p>
            <button
              onClick={() => setShowProportionalModal(false)}
              className="text-amber-600 hover:text-amber-900 text-xl leading-none font-black"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Informe o <strong>dia em que o morador saiu</strong> da república neste mês.
            A cota será recalculada como: <strong>(dia saída ÷ total de dias do mês)</strong>.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-amber-900 whitespace-nowrap">Dia de saída:</label>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 15"
              value={exitDayInput}
              onChange={e => setExitDayInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveProportional()}
              className="w-20 px-2 py-1.5 border-2 border-amber-300 rounded-lg text-sm text-center font-black focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              autoFocus
            />
            {hasProportional && (
              <span className="text-xs text-amber-800 font-black">
                Atual: dia {exitDay} ({proportionalPercent}%)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="success" size="sm" onClick={handleSaveProportional} fullWidth>Salvar</Button>
            {hasProportional && (
              <Button variant="secondary" size="sm" onClick={handleClearProportional} fullWidth>Remover</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowProportionalModal(false)} fullWidth>Cancelar</Button>
          </div>
        </div>
      )}

      {/* ===== SALDO ANTERIOR ===== */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">Saldo anterior</span>
          <span className={`text-base font-black ${previousBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            R$ {Math.abs(previousBalance).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ===== INFORMAÇÕES PRINCIPAIS ===== */}
      <div className="p-5 space-y-3 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
            Divisão deste mês
            {hasProportional && (
              <span className="ml-1 text-amber-600 font-black">({proportionalPercent}%)</span>
            )}
          </span>
          <span className="text-base font-black text-slate-900">
            R$ {currentMonthDue.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">Total Final</span>
          <span className="text-base font-black text-slate-900">
            R$ {totalDue.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">Já Pagou</span>
          <span className="text-base font-black text-slate-900">
            R$ {totalPaid.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ===== SALDO PRINCIPAL ===== */}
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <div className="text-center">
          <p className="text-xs font-black text-slate-600 uppercase tracking-tighter mb-2">{statusLabel}</p>
          <div className={`text-4xl font-black ${statusColor}`}>
            R$ {Math.abs(remainingBalance).toFixed(2)}
          </div>
        </div>
      </div>

      {/* ===== BOTÃO PAGAMENTOS ===== */}
      <div className="px-5 py-3 border-t border-slate-100">
        <Button
          variant="secondary"
          size="md"
          icon={expandedPayments ? '▼' : '▶'}
          onClick={() => setExpandedPayments(!expandedPayments)}
          fullWidth
        >
          Pagamentos ({payments.length})
        </Button>
      </div>

      {/* ===== SEÇÃO EXPANDIDA — PAGAMENTOS ===== */}
      {expandedPayments && (
        <div className="px-5 py-4 space-y-4 border-t border-slate-100 bg-slate-50">
          {/* Pagamentos Registrados */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                Pagamentos Registrados ({payments.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center text-xs p-3 rounded-lg bg-white border-2 border-slate-100 hover:border-slate-200 transition-all">
                    <div className="flex-1">
                      <div className="font-black text-slate-900">R$ {payment.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {payment.proofUrl ? (
                        <Button
                          variant="icon"
                          size="sm"
                          icon="👁"
                          onClick={() => setViewingProof(payment.proofUrl)}
                          title="Visualizar comprovante"
                        />
                      ) : (
                        <Button
                          variant="icon"
                          size="sm"
                          icon="📎"
                          title="Anexar comprovante"
                          disabled
                        />
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        icon="✕"
                        onClick={() => onDeletePayment?.(payment.id)}
                        title="Deletar pagamento"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registrar Pagamento */}
          {onRegisterPayment && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tighter">Novo Pagamento</h4>
            {!showPaymentForm ? (
              <Button
                variant="primary"
                size="md"
                icon="+"
                onClick={() => setShowPaymentForm(true)}
                fullWidth
              >
                Registrar Pagamento
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-black text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white font-bold"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="md"
                    onClick={handlePayment}
                    fullWidth
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount('');
                    }}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* ===== MODAL DE VISUALIZAÇÃO DE COMPROVANTE ===== */}
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
