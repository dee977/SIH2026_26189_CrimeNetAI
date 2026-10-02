import { create } from 'zustand';
import { apiClient } from '../services/apiClient';
import { AlertItem } from '../types/alerts';

interface AlertStore {
  unreadCount: number;
  dropdownAlerts: AlertItem[];
  isDropdownOpen: boolean;
  isLoadingDropdown: boolean;
  
  fetchUnreadCount: () => Promise<void>;
  fetchDropdownAlerts: () => Promise<void>;
  markAlertsAsRead: (alertIds: string[]) => Promise<void>;
  setDropdownOpen: (isOpen: boolean) => void;
  toggleDropdown: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  unreadCount: 0,
  dropdownAlerts: [],
  isDropdownOpen: false,
  isLoadingDropdown: false,

  fetchUnreadCount: async () => {
    try {
      const res = await apiClient.get<{ data: { count: number } }>('/api/v1/alerts/unread_count');
      set({ unreadCount: res.data.data.count });
    } catch (err) {
      console.warn('Failed to fetch unread count:', err);
    }
  },

  fetchDropdownAlerts: async () => {
    set({ isLoadingDropdown: true });
    try {
      const res = await apiClient.get<any>('/api/v1/alerts');
      const rawItems = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
      const normalized: AlertItem[] = rawItems.map((raw: any) => ({
        id: raw.alertId || raw.id,
        caseId: raw.caseId,
        category: raw.metadata?.category || raw.alertType || 'Anomaly Detected',
        severity: (raw.severity || 'HIGH').toUpperCase(),
        title: raw.title || 'Investigative Anomaly',
        explanation: raw.description || raw.explanation || 'Anomaly detected.',
        source: raw.metadata?.source || raw.source || 'CrimeNet',
        sourceRecordId: raw.evidenceId || undefined,
        timestamp: raw.triggeredAt ? raw.triggeredAt.replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
        isReviewed: raw.status === 'RESOLVED' || raw.status === 'ACKNOWLEDGED' || !!raw.metadata?.reviewedBy || raw.isRead || raw.read || false,
        linkedEntities: [],
        history: []
      }));
      set({ dropdownAlerts: normalized });
    } catch (err) {
      console.warn('Failed to fetch dropdown alerts:', err);
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  markAlertsAsRead: async (alertIds) => {
    if (alertIds.length === 0) return;
    try {
      await apiClient.post('/api/v1/alerts/mark_read', { alertIds });
      // Instantly update counter
      set((state) => ({ 
        unreadCount: Math.max(0, state.unreadCount - alertIds.length),
        dropdownAlerts: state.dropdownAlerts.map(a => 
          alertIds.includes(a.id) ? { ...a, isReviewed: true } : a
        )
      }));
    } catch (err) {
      console.warn('Failed to mark alerts read:', err);
    }
  },

  setDropdownOpen: (isOpen) => {
    set({ isDropdownOpen: isOpen });
  },

  toggleDropdown: () => {
    set((state) => ({ isDropdownOpen: !state.isDropdownOpen }));
  }
}));
