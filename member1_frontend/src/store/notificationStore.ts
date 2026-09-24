import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationState {
  toasts: ToastMessage[];
  unreadAlertCount: number;
  isNotificationDropdownOpen: boolean;
  
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleNotificationDropdown: () => void;
  setUnreadAlertCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  unreadAlertCount: 4,
  isNotificationDropdownOpen: false,

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast = { ...toast, id };
    
    set(state => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.duration || 4000;
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  toggleNotificationDropdown: () => {
    set(state => ({ isNotificationDropdownOpen: !state.isNotificationDropdownOpen }));
  },

  setUnreadAlertCount: (count) => {
    set({ unreadAlertCount: count });
  }
}));
