import { apiClient } from './apiClient';
import { AlertItem, AlertCategory, AlertSeverity } from '../types/alerts';

export const normalizeAlert = (raw: any): AlertItem => {
  const id = raw.alertId || raw.id || `ALT-${Math.random().toString(36).substring(7)}`;
  const cat = raw.metadata?.category || raw.alertType || 'Anomaly Detected';
  const sev = (raw.severity || 'HIGH').toUpperCase() as AlertSeverity;
  const isRev = raw.status === 'RESOLVED' || raw.status === 'ACKNOWLEDGED' || !!raw.metadata?.reviewedBy;
  const isRead = raw.isRead === true || raw.read === true;

  const linked: { id: string; label: string; type: string }[] = [];
  if (raw.metadata?.linkedEntities && Array.isArray(raw.metadata.linkedEntities)) {
    linked.push(...raw.metadata.linkedEntities);
  } else if (raw.relatedEntityId) {
    linked.push({
      id: raw.relatedEntityId,
      label: raw.relatedEntityName || raw.relatedEntityId,
      type: 'Entity'
    });
  }

  return {
    id,
    caseId: raw.caseId || undefined,
    category: cat as AlertCategory,
    severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].includes(sev) ? sev : 'HIGH',
    title: raw.title || 'Investigative Anomaly',
    explanation: raw.description || raw.explanation || 'Anomaly detected during graph analysis.',
    source: raw.metadata?.source || raw.source || 'CrimeNet Automated Core Engine',
    sourceRecordId: raw.evidenceId || undefined,
    timestamp: raw.triggeredAt ? raw.triggeredAt.replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
    isReviewed: !!isRev,
    isRead,
    reviewedBy: raw.metadata?.reviewedBy || (isRev ? 'Investigator' : undefined),
    reviewedAt: raw.metadata?.reviewedAt ? raw.metadata.reviewedAt.replace('T', ' ').slice(0, 16) : undefined,
    reviewNotes: raw.metadata?.reviewNotes || undefined,
    linkedEntities: linked,
    history: []
  };
};

export const alertService = {
  async fetchAlerts(caseId?: string): Promise<AlertItem[]> {
    try {
      const params: Record<string, any> = {};
      if (caseId && caseId !== 'ALL') {
        params.caseId = caseId;
      }
      const res = await apiClient.get<any>('/api/v1/alerts', { params });
      const rawItems = Array.isArray(res.data)
        ? res.data
        : (res.data?.items || res.data?.data || []);
      return rawItems.map(normalizeAlert);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      return [];
    }
  },

  async fetchUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ count: number }>('/api/v1/alerts/unread_count');
      return res.data?.count ?? 0;
    } catch (err) {
      console.warn('Failed to fetch unread alert count:', err);
      return 0;
    }
  },

  async markAlertsAsRead(alertIds?: string[]): Promise<boolean> {
    try {
      await apiClient.post('/api/v1/alerts/mark_read', { alertIds });
      return true;
    } catch (err) {
      console.warn('Failed to mark alerts as read:', err);
      return false;
    }
  },

  async acknowledgeAlert(alertId: string, notes?: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/v1/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
        status: 'RESOLVED',
        resolutionNotes: notes || 'Acknowledged by Investigator'
      });
      return true;
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      return false;
    }
  }
};
