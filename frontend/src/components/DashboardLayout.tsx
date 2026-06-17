
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CustomizationPanel from './CustomizationPanel';
import { useCustomization } from '../contexts/CustomizationContext';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const navigate = useNavigate();
  const { updateSettings } = useCustomization();
  const { resident, logout } = useAuth();

  // Detectar mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Garantir que o modo claro seja o padrão e único
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Função para deslogar do sistema
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = resident?.role === 'admin';

  // Menu baseado em papel
  const menuItems = [
    { path: '/monthly', label: 'Caixinha Mensal', icon: '💰', show: true },
    { path: '/residents', label: 'Moradores', icon: '👥', show: true },
    { path: '/expenses', label: 'Despesas', icon: '💸', show: true },
    { path: '/budgets', label: 'Orçamentos', icon: '📋', show: true },
    { path: '/analytics', label: 'Análises', icon: '📈', show: true },
    { path: '/monthly-responsibles', label: 'Responsáveis', icon: '👑', show: isAdmin },
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-gray-100 flex-col md:flex-row">
      {/* Sidebar - Overlay no mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 shadow-lg flex flex-col ${isMobile ? (sidebarOpen ? 'fixed left-0 top-0 h-screen z-40' : 'hidden') : ''
          }`}
      >
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">
                C
              </div>
              {(sidebarOpen || !isMobile) && <h1 className="text-lg font-bold hidden md:block">Caixinha</h1>}
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-300 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all duration-200 text-sm md:text-base ${isActive(item.path)
                ? 'bg-indigo-600 text-white font-semibold shadow-md'
                : 'text-slate-300 hover:bg-slate-700'
                }`}
              title={item.label}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Seção Inferior: Usuário, Logout e Toggle */}
        <div className="border-t border-slate-700 p-2 md:p-4 flex flex-col gap-2">
          {/* Info do usuário */}
          {sidebarOpen && resident && (
            <div className="px-3 py-2 text-xs text-slate-400 truncate">
              <span className="font-semibold text-slate-300">{resident.nickname}</span>
              {resident.role === 'admin' && (
                <span className="ml-1 text-indigo-400">(admin)</span>
              )}
            </div>
          )}
          {/* Botão de Sair */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all duration-200 text-sm md:text-base text-red-400 hover:bg-red-500/20 hover:text-red-300 font-semibold w-full ${!sidebarOpen && 'justify-center'}`}
            title="Sair do Sistema"
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {sidebarOpen && <span className="text-sm">Sair</span>}
          </button>

          {/* Toggle Button - Desktop only */}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center p-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-700 mt-2"
              title={sidebarOpen ? 'Encolher Menu' : 'Expandir Menu'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col w-full md:w-auto">
        {/* Header */}
        <header className="bg-white border-gray-200 shadow-sm border-b sticky top-0 z-40">
          <div className="px-4 md:px-8 py-3 md:py-4 flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold truncate text-gray-900">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
                  title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
                >
                  {sidebarOpen ? '✕' : '☰'}
                </button>
              )}
              <button
                onClick={() => setCustomizationOpen(true)}
                className="p-2 rounded-lg transition-colors text-lg flex-shrink-0 text-gray-600 hover:bg-gray-100"
                title="Customização"
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 text-gray-900">
          {children}
        </div>
        {/* Customization Panel */}
        <CustomizationPanel
          isOpen={customizationOpen}
          onClose={() => setCustomizationOpen(false)}
          onSettingsChange={updateSettings}
          darkMode={false}
        />
      </main>
    </div>
  );
}