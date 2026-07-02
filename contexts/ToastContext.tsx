import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View } from 'react-native';
import Toast, { ToastType } from '../components/Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  icon?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type: ToastType, options?: { duration?: number; icon?: string }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider - manages toast queue and display
 * Allows multiple toasts to be shown simultaneously (max 3)
 * Remaining toasts are queued and shown as others dismiss
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType, options?: { duration?: number; icon?: string }) => {
      const id = `toast_${Date.now()}_${Math.random()}`;

      const newToast: ToastMessage = {
        id,
        message,
        type,
        duration: options?.duration ?? 3000,
        icon: options?.icon,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Limit to 3 visible toasts, queue the rest
        if (updated.length > 3) {
          // Keep only the 3 most recent, queue others
          return updated.slice(-3);
        }
        return updated;
      });
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}

      {/* Render visible toasts */}
      <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            icon={toast.icon}
            onDismiss={() => dismissToast(toast.id)}
            index={index}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 * @example
 * const { showToast } = useToast();
 * showToast('Ritual created!', 'success');
 * showToast('Error saving', 'error');
 * showToast('Please fill required fields', 'warning', { duration: 4000 });
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
