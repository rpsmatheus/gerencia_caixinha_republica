

import { useCustomization } from '../contexts/CustomizationContext';

export function useCustomizationStyles() {
  const { settings } = useCustomization();

  /**
   * Retorna a cor CSS para uma categoria de morador
   */
  const getCategoryColor = (category: 'bixo' | 'agregado' | 'morador'): string => {
    return settings.colors[category];
  };

  /**
   * Retorna a cor CSS para um status
   */
  const getStatusColor = (status: 'success' | 'error' | 'warning'): string => {
    return settings.colors[status];
  };

  /**
   * Retorna classes Tailwind para tamanho de fonte
   */
  const getFontSizeClass = (): string => {
    const map = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    };
    return map[settings.styles.fontSize];
  };

  /**
   * Retorna classes Tailwind para border radius
   */
  const getBorderRadiusClass = (): string => {
    const map = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
    };
    return map[settings.styles.borderRadius];
  };

  /**
   * Retorna classes Tailwind para espaçamento
   */
  const getSpacingClass = (): string => {
    const map = {
      compact: 'gap-2',
      normal: 'gap-4',
      spacious: 'gap-6',
    };
    return map[settings.styles.spacing];
  };

  /**
   * Retorna estilos inline para um card com customização
   */
  const getCardStyles = (): React.CSSProperties => {
    return {
      borderRadius: `var(--border-radius)`,
      fontSize: `var(--font-size)`,
    };
  };

  /**
   * Retorna estilos inline para um badge de categoria
   */
  const getCategoryBadgeStyles = (category: 'bixo' | 'agregado' | 'morador'): React.CSSProperties => {
    const color = getCategoryColor(category);
    return {
      backgroundColor: `${color}20`, // 20% opacity
      color: color,
      borderRadius: `var(--border-radius)`,
    };
  };

  /**
   * Retorna estilos inline para um botão com cor customizada
   */
  const getButtonStyles = (colorKey: keyof typeof settings.colors): React.CSSProperties => {
    const color = settings.colors[colorKey];
    return {
      backgroundColor: color,
      borderRadius: `var(--border-radius)`,
    };
  };

  /**
   * Retorna o texto customizado para uma página
   */
  const getPageText = (key: keyof typeof settings.texts): string => {
    return settings.texts[key];
  };

  return {
    getCategoryColor,
    getStatusColor,
    getFontSizeClass,
    getBorderRadiusClass,
    getSpacingClass,
    getCardStyles,
    getCategoryBadgeStyles,
    getButtonStyles,
    getPageText,
    settings,
  };
}
