
import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 3000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-200',
          icon: '✓',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-200',
          icon: '✕',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-200',
          icon: 'ℹ',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-200',
          icon: '•',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`
        fixed top-4 right-4 max-w-md
        ${styles.bg} ${styles.border}
        border rounded-lg p-4
        flex items-start gap-3
        shadow-sm
        animate-in fade-in slide-in-from-top-2
        z-50
      `}
    >
      <span className={`text-lg font-bold flex-shrink-0 ${styles.text}`}>
        {styles.icon}
      </span>
      <p className={`text-sm font-medium ${styles.text}`}>
        {message}
      </p>
    </div>
  );
}
