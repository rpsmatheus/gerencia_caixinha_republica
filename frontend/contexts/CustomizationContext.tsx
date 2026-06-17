/**
 * Contexto de Customização Global
 * 
 * Fornece acesso às configurações de customização em toda a aplicação
 * Permite que qualquer componente acesse e aplique estilos customizados
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface CustomizationContextType {
  settings: CustomizationSettings;
  updateSettings: (settings: CustomizationSettings) => void;
  resetSettings: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CustomizationSettings>(DEFAULT_SETTINGS);

  // Carregar configurações do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem('caixinhaCustomization');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
        applyCustomizationStyles(JSON.parse(saved));
      } catch (err) {
        console.error('Erro ao carregar customizações:', err);
      }
    } else {
      applyCustomizationStyles(DEFAULT_SETTINGS);
    }
  }, []);

  const updateSettings = (newSettings: CustomizationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('caixinhaCustomization', JSON.stringify(newSettings));
    applyCustomizationStyles(newSettings);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('caixinhaCustomization');
    applyCustomizationStyles(DEFAULT_SETTINGS);
  };

  return (
    <CustomizationContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization deve ser usado dentro de CustomizationProvider');
  }
  return context;
}

/**
 * Aplica estilos de customização como CSS variables no documento
 */
function applyCustomizationStyles(settings: CustomizationSettings) {
  const root = document.documentElement;
  
  // Aplicar cores
  root.style.setProperty('--color-primary', settings.colors.primary);
  root.style.setProperty('--color-secondary', settings.colors.secondary);
  root.style.setProperty('--color-bixo', settings.colors.bixo);
  root.style.setProperty('--color-agregado', settings.colors.agregado);
  root.style.setProperty('--color-morador', settings.colors.morador);
  root.style.setProperty('--color-success', settings.colors.success);
  root.style.setProperty('--color-error', settings.colors.error);
  root.style.setProperty('--color-warning', settings.colors.warning);

  // Aplicar tamanho de fonte
  const fontSizeMap = {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
  };
  root.style.setProperty('--font-size', fontSizeMap[settings.styles.fontSize]);

  // Aplicar border radius
  const borderRadiusMap = {
    none: '0px',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
  };
  root.style.setProperty('--border-radius', borderRadiusMap[settings.styles.borderRadius]);

  // Aplicar espaçamento
  const spacingMap = {
    compact: '0.5rem',
    normal: '1rem',
    spacious: '1.5rem',
  };
  root.style.setProperty('--spacing', spacingMap[settings.styles.spacing]);
}
