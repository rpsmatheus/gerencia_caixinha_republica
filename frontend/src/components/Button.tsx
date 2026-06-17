
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: string | React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 active:scale-95',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 active:scale-95',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200 active:scale-95',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200',
  icon: 'bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-bold rounded-lg',
  md: 'px-4 py-2 text-sm font-bold rounded-xl',
  lg: 'px-6 py-3 text-base font-bold rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isIconOnly = icon && !children;

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-bold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${isIconOnly ? 'w-10 h-10 rounded-lg' : sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin">⟳</span>
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="text-base">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="text-base">{icon}</span>}
        </>
      )}
    </button>
  );
}
