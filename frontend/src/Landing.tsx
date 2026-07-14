/**
 * Landing Page Principal
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

export default function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ identifier: '', password: '', nickname: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, mustChangePassword } = useAuth();

  const openModal = (initialMode: 'login' | 'register') => {
    setMode(initialMode);
    setError('');
    setIsModalOpen(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await register(formData.nickname, formData.password);
      } else {
        await login(formData.identifier, formData.password);
      }
      // Redirecionamento gerenciado pelo App.tsx via mustChangePassword
      if (mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/monthly', { replace: true });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? (mode === 'register' ? 'Não foi possível criar a conta.' : 'Credenciais inválidas.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">C</div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Caixinha</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => openModal('login')}
              className="px-4 sm:px-6 py-2.5 text-slate-600 font-bold hover:text-indigo-600 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => openModal('register')}
              className="px-4 sm:px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              Registrar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-50/80 rounded-full blur-3xl opacity-80 animate-pulse-soft"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/80 rounded-full blur-3xl opacity-80 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

            {/* Lado Esquerdo - Textos */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
                Gestão Inteligente de Repúblicas
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                O fim das <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">brigas por dinheiro</span> na sua casa.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                O Caixinha App divide automaticamente as contas de luz, água, internet e aluguel. Saiba exatamente quem pagou e quem está devendo, sem usar planilhas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => openModal('register')}
                  className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  Criar Caixinha Grátis
                </button>
                <button
                  onClick={() => openModal('login')}
                  className="px-8 py-4 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Acessar Conta
                </button>
              </div>

              <div className="mt-14 flex items-center justify-center lg:justify-start gap-6 sm:gap-10 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-3xl font-black text-slate-900">100%</span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-slate-500">Transparente</span>
                </div>
                <div className="w-px h-10 bg-slate-300"></div>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-3xl font-black text-slate-900">Zero</span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-slate-500">Planilhas</span>
                </div>
                <div className="w-px h-10 bg-slate-300"></div>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-3xl font-black text-slate-900">24/7</span>
                  <span className="text-xs font-bold uppercase tracking-tighter text-slate-500">Disponível</span>
                </div>
              </div>
            </div>

            {/* Lado Direito - Preview Visual */}
            <div className="flex-1 w-full max-w-xl relative mt-10 lg:mt-0">

              {/* Card Preto */}
              <div className="relative bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-900/20 border-4 border-slate-800 transform rotate-2 hover:rotate-0 transition-transform duration-500 cursor-default">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner">C</div>
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 bg-red-400 rounded-full"></div>
                    <div className="w-3.5 h-3.5 bg-amber-400 rounded-full"></div>
                    <div className="w-3.5 h-3.5 bg-green-400 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-wider">Fechamento do Mês</p>
                    <h3 className="text-white text-3xl font-black">Novembro / 2026</h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="h-16 w-full bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center px-5 justify-between hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">🏠</div>
                        <span className="text-slate-200 font-semibold">Aluguel + Condomínio</span>
                      </div>
                      <span className="text-white font-black">R$ 1.500</span>
                    </div>

                    <div className="h-16 w-full bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center px-5 justify-between hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">⚡</div>
                        <span className="text-slate-200 font-semibold">Internet / Energia</span>
                      </div>
                      <span className="text-white font-black">R$ 250</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ícone flutuante de Pagamento (Fica por cima por vir depois no HTML) */}
              <div className="absolute -top-8 -left-4 sm:-left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl font-black">✓</div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pagamento Confirmado</p>
                    <p className="text-base font-black text-slate-800">R$ 450,00</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Seção Funcionalidades */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Recursos Exclusivos</h2>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">Tudo o que sua república precisa em um só lugar.</h3>
            <p className="text-slate-600 text-lg">Esqueça o bloco de notas e o grupo do WhatsApp. Automatize a cobrança e a organização financeira da casa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Moradores', desc: 'Cadastre quem mora na casa e defina regras proporcionais.' },
              { icon: '🧾', title: 'Despesas', desc: 'Registre contas fixas e variáveis com comprovantes anexados.' },
              { icon: '💰', title: 'Caixinha', desc: 'Cálculo instantâneo de quem deve o que no final do mês.' },
              { icon: '📊', title: 'Análises', desc: 'Gráficos interativos para entender onde o dinheiro está indo.' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6">{item.icon}</div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{item.title}</h4>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Como funciona o Caixinha?</h2>
            <p className="text-slate-600 mt-4 text-lg">3 passos simples para acabar com a dor de cabeça.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-100 -z-10"></div>

            <div className="text-center relative">
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-200">1</div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Cadastre a Galera</h3>
              <p className="text-slate-600">Adicione todos os moradores. O sistema entende até quem se mudou no meio do mês e cobra proporcional.</p>
            </div>

            <div className="text-center relative">
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-200">2</div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Lance as Contas</h3>
              <p className="text-slate-600">Água, luz, aluguel, rolê no mercado. Jogue tudo no aplicativo assim que a conta chegar.</p>
            </div>

            <div className="text-center relative">
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-200">3</div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Feche o Mês</h3>
              <p className="text-slate-600">Com um clique, o sistema divide tudo, avisa quem deve quanto e para quem o Pix deve ser enviado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-50"></div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10">Pronto para organizar sua república?</h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">Junte-se a dezenas de casas de estudantes que pararam de brigar por causa de dinheiro e começaram a usar o Caixinha App.</p>

            <button
              onClick={() => openModal('register')}
              className="relative z-10 px-10 py-5 bg-indigo-500 text-white text-xl font-black rounded-2xl hover:bg-indigo-400 hover:scale-105 transition-all shadow-xl"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">C</div>
            <span className="text-lg font-black text-slate-900 tracking-tight">Caixinha</span>
          </div>
          <p className="text-slate-500 font-medium text-sm text-center">
            © {new Date().getFullYear()} Caixinha App. Feito para repúblicas e repúblicos.
          </p>
          <div className="flex gap-4">
            <button type="button" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">📱</button>
            <button type="button" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">✉️</button>
          </div>
        </div>
      </footer>

      {/* Auth Modal - ALVO ABSOLUTO z- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Overlay escuro com desfoque */}
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}></div>

          {/* Caixa do Modal */}
          <div className="relative z-10 bg-white w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 shadow-2xl focus:outline-none" tabIndex={-1}>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-slate-400 hover:text-slate-600 transition-colors text-2xl p-2 hover:bg-slate-100 rounded-full">✕</button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {mode === 'register' ? 'Crie sua república' : 'Bem-vindo de volta!'}
            </h2>
            <p className="text-slate-500 mb-8 font-medium">
              {mode === 'register'
                ? 'Você será o administrador desta república.'
                : 'Entre para gerenciar sua república.'}
            </p>
            <form onSubmit={handleAuth} className="space-y-4">

              <input
                type="text"
                required
                placeholder={mode === 'register' ? 'Escolha um usuário' : 'Usuário'}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-base text-slate-900"
                value={mode === 'register' ? formData.nickname : formData.identifier}
                onChange={e =>
                  setFormData(
                    mode === 'register'
                      ? { ...formData, nickname: e.target.value }
                      : { ...formData, identifier: e.target.value }
                  )
                }
                autoComplete="username"
              />

              <input
                type="password"
                required
                minLength={mode === 'register' ? 6 : undefined}
                placeholder="Senha"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-base text-slate-900"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />

              {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white text-lg font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 disabled:opacity-50 mt-2 transition-all active:scale-[0.98]">
                {loading
                  ? (mode === 'register' ? 'Criando...' : 'Entrando...')
                  : (mode === 'register' ? 'Criar Conta' : 'Entrar no Sistema')}
              </button>

              <button
                type="button"
                onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
                className="w-full text-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors pt-1"
              >
                {mode === 'register' ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Criar república'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}