
export function ValueInput({
  value,
  onChange,
  className = '',
  darkMode = false,
}: {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  darkMode?: boolean;
}) {
  const inputClass = darkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900';

  const isEmpty = !value || value === 0 || value === '0';

  return (
    <div className="relative">
      <input
        type="number"
        step="0.01"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder={isEmpty ? '0.00' : ''}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass} ${className}`}
        required
      />
    </div>
  );
}

interface ActionButtonProps {
  type: 'edit' | 'delete' | 'add' | 'attach' | 'category' | 'expense';
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
  showText?: boolean;
}

const getButtonConfig = (type: ActionButtonProps['type']) => {
  const configs = {
    edit: {
      emoji: '✎',
      text: 'Editar',
      bgColor: 'bg-green-600 hover:bg-green-700',
    },
    delete: {
      emoji: '✕',
      text: 'Deletar',
      bgColor: 'bg-red-600 hover:bg-red-700',
    },
    add: {
      emoji: '+',
      text: 'Adicionar',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
    },
    attach: {
      emoji: '📎',
      text: 'Anexar',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
    },
    category: {
      emoji: '+',
      text: 'Categoria',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
    },
    expense: {
      emoji: '+',
      text: 'Despesa',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  return configs[type];
};

export default function ActionButton({
  type,
  onClick,
  title,
  disabled = false,
  className = '',
  showText = false,
}: ActionButtonProps) {
  const config = getButtonConfig(type);

  if (showText) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title || config.text}
        className={`
          px-4 py-2 rounded-lg flex items-center justify-center gap-2
          text-white font-semibold text-sm
          transition-all duration-200
          ${config.bgColor}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        <span>{config.emoji}</span>
        <span>{config.text}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || config.text}
      className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        text-white font-bold text-lg
        transition-all duration-200
        ${config.bgColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {config.emoji}
    </button>
  );
}
