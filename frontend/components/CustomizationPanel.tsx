/**
 * Painel de Customização Visual
 * 
 * Permite customizar cores, textos e estilos da aplicação
 * Todas as mudanças são salvas em localStorage
 * 
 * @author Manus AI
 * @version 2.3.0
 */

import { useState, useEffect } from 'react';

export interface CustomizationSettings {
  colors: {
    primary: string;
    secondary: string;
    bixo: string;
    agregado: string;
    morador: string;
    success: string;
    error: string;
    warning: string;
  };
  texts: {
    appTitle: string;
    monthlyDashboard: string;
    expenses: string;
    residents: string;
    analytics: string;
  };
  styles: {
    fontSize: 'sm' | 'base' | 'lg';
    borderRadius: 'none' | 'sm' | 'md' | 'lg';
    spacing: 'compact' | 'normal' | 'spacious';
  };
}

const DEFAULT_SETTINGS: CustomizationSettings = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    bixo: '#3b82f6',
    agregado: '#f59e0b',
    morador: '#10b981',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  texts: {
    appTitle: 'Caixinha Dashboard',
    monthlyDashboard: 'Caixinha Mensal',
    expenses: 'Despesas',
    residents: 'Integrantes',
    analytics: 'Análises',
  },
  styles: {
    fontSize: 'base',
    borderRadius: 'md',
    spacing: 'normal',
  },
};

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: CustomizationSettings) => void;
  darkMode: boolean; // Mantido por compatibilidade de props mas ignorado visualmente
}

export default function CustomizationPanel({
  isOpen,
  onClose,
  onSettingsChange,
}: CustomizationPanelProps) {
  const [settings, setSettings] = useState<CustomizationSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'colors' | 'texts' | 'styles'>('colors');

  // Carregar configurações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('caixinhaCustomization');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Erro ao carregar customizações:', err);
      }
    }
  }, []);

  // Salvar configurações
  const handleSave = () => {
    localStorage.setItem('caixinhaCustomization', JSON.stringify(settings));
    onSettingsChange(settings);
    alert('Configurações salvas com sucesso!');
  };

  // Resetar para padrão
  const handleReset = () => {
    if (confirm('Deseja resetar todas as customizações para o padrão?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('caixinhaCustomization');
      onSettingsChange(DEFAULT_SETTINGS);
      alert('Customizações resetadas!');
    }
  };

  // Exportar configurações
  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'caixinha-customization.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importar configurações
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setSettings(imported);
          localStorage.setItem('caixinhaCustomization', JSON.stringify(imported));
          onSettingsChange(imported);
          alert('Configurações importadas com sucesso!');
        } catch (err) {
          alert('Erro ao importar arquivo!');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  const bgClass = 'bg-white';
  const textClass = 'text-gray-900';
  const borderClass = 'border-gray-300';
  const hoverClass = 'hover:bg-gray-100';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${bgClass} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${borderClass}`}>
          <h2 className={`text-2xl font-bold ${textClass}`}>Customização</h2>
          <button
            onClick={onClose}
            className={`text-2xl ${textClass} hover:opacity-70`}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${borderClass}`}>
          {(['colors', 'texts', 'styles'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? `border-b-2 border-blue-600 ${textClass}`
                  : `${textClass} opacity-60 ${hoverClass}`
              }`}
            >
              {tab === 'colors' && 'Cores'}
              {tab === 'texts' && 'Textos'}
              {tab === 'styles' && 'Estilos'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Cores */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${textClass}`}>Cores Principais</h3>
              
              {[
                { key: 'primary', label: 'Cor Primária' },
                { key: 'secondary', label: 'Cor Secundária' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className={`flex-1 ${textClass}`}>{label}</label>
                  <input
                    type="color"
                    value={settings.colors[key as keyof typeof settings.colors]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: {
                          ...settings.colors,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                </div>
              ))}

              <h3 className={`text-lg font-semibold ${textClass} mt-6`}>Cores de Categorias</h3>
              
              {[
                { key: 'bixo', label: 'Bixo' },
                { key: 'agregado', label: 'Agregado' },
                { key: 'morador', label: 'Morador' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className={`flex-1 ${textClass}`}>{label}</label>
                  <input
                    type="color"
                    value={settings.colors[key as keyof typeof settings.colors]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: {
                          ...settings.colors,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                </div>
              ))}

              <h3 className={`text-lg font-semibold ${textClass} mt-6`}>Cores de Status</h3>
              
              {[
                { key: 'success', label: 'Sucesso' },
                { key: 'error', label: 'Erro' },
                { key: 'warning', label: 'Aviso' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className={`flex-1 ${textClass}`}>{label}</label>
                  <input
                    type="color"
                    value={settings.colors[key as keyof typeof settings.colors]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: {
                          ...settings.colors,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Textos */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${textClass}`}>Nomes das Páginas</h3>
              
              {[
                { key: 'appTitle', label: 'Título da App' },
                { key: 'monthlyDashboard', label: 'Caixinha Mensal' },
                { key: 'expenses', label: 'Despesas' },
                { key: 'residents', label: 'Integrantes' },
                { key: 'analytics', label: 'Análises' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className={`flex-1 ${textClass}`}>{label}</label>
                  <input
                    type="text"
                    value={settings.texts[key as keyof typeof settings.texts]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        texts: {
                          ...settings.texts,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className={`flex-1 px-3 py-2 rounded border ${borderClass} bg-white ${textClass}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Estilos */}
          {activeTab === 'styles' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-lg font-semibold ${textClass} mb-2`}>
                  Tamanho de Fonte
                </label>
                <select
                  value={settings.styles.fontSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      styles: {
                        ...settings.styles,
                        fontSize: e.target.value as 'sm' | 'base' | 'lg',
                      },
                    })
                  }
                  className={`w-full px-3 py-2 rounded border ${borderClass} bg-white ${textClass}`}
                >
                  <option value="sm">Pequeno</option>
                  <option value="base">Normal</option>
                  <option value="lg">Grande</option>
                </select>
              </div>

              <div>
                <label className={`block text-lg font-semibold ${textClass} mb-2`}>
                  Arredondamento
                </label>
                <select
                  value={settings.styles.borderRadius}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      styles: {
                        ...settings.styles,
                        borderRadius: e.target.value as 'none' | 'sm' | 'md' | 'lg',
                      },
                    })
                  }
                  className={`w-full px-3 py-2 rounded border ${borderClass} bg-white ${textClass}`}
                >
                  <option value="none">Nenhum</option>
                  <option value="sm">Pequeno</option>
                  <option value="md">Médio</option>
                  <option value="lg">Grande</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${borderClass} flex flex-wrap gap-4 justify-between`}>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded transition-colors"
            >
              Resetar
            </button>
            <button
              onClick={handleExport}
              className={`px-4 py-2 ${textClass} font-semibold ${hoverClass} rounded transition-colors`}
            >
              Exportar
            </button>
            <label className={`px-4 py-2 ${textClass} font-semibold ${hoverClass} rounded transition-colors cursor-pointer`}>
              Importar
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`px-6 py-2 border ${borderClass} ${textClass} font-semibold rounded hover:bg-gray-50 transition-colors`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors shadow-md"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
