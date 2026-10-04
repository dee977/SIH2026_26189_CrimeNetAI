import { create } from 'zustand';
import { AlertItem } from '../types/alerts';
import { alertService } from '../services/alertService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationState {
  toasts: ToastMessage[];
  alerts: AlertItem[];
  unreadAlertCount: number;
  isLoadingAlerts: boolean;
  isNotificationDropdownOpen: boolean;
  
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleNotificationDropdown: () => void;
  setNotificationDropdownOpen: (open: boolean) => void;
  closeNotificationDropdown: () => void;
  setUnreadAlertCount: (count: number) => void;
  fetchAlerts: (caseId?: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  alerts: [],
  unreadAlertCount: 0,
  isLoadingAlerts: false,
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
    const nextState = !get().isNotificationDropdownOpen;
    set({ isNotificationDropdownOpen: nextState });
    if (nextState) {
      get().fetchAlerts();
    }
  },

  setNotificationDropdownOpen: (open: boolean) => {
    set({ isNotificationDropdownOpen: open });
    if (open) {
      get().fetchAlerts();
    }
  },

  closeNotificationDropdown: () => {
    set({ isNotificationDropdownOpen: false });
  },

  setUnreadAlertCount: (count) => {
    set({ unreadAlertCount: count });
  },

  fetchAlerts: async (caseId?: string) => {
    set({ isLoadingAlerts: true });
    try {
      const items = await alertService.fetchAlerts(caseId);
      const unread = items.filter(a => !a.isRead && !a.isReviewed).length;
      set({ 
        alerts: items, 
        unreadAlertCount: unread,
        isLoadingAlerts: false 
      });
    } catch {
      set({ isLoadingAlerts: false });
    }
  },

  markAllAsRead: async () => {
    const unreadIds = get().alerts.filter(a => !a.isRead).map(a => a.id);
    if (unreadIds.length > 0) {
      await alertService.markAlertsAsRead(unreadIds);
    }
    set(state => ({
      unreadAlertCount: 0,
      alerts: state.alerts.map(a => ({ ...a, isRead: true }))
    }));
  }
}));
