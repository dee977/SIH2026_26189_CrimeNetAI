export type TimelineCategory = 
  | 'Event'
  | 'Communication'
  | 'Transaction'
  | 'Location'
  | 'Crime'
  | 'Relationship';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: TimelineCategory;
  title: string;
  description: string;
  primaryEntity: {
    id: string;
    label: string;
    type: string;
  };
  secondaryEntity?: {
    id: string;
    label: string;
    type: string;
  };
  locationName?: string;
  source: string;
  sourceEvidenceId?: string;
  isBurstPoint?: boolean;
  metadata?: Record<string, any>;
}

export interface ActivityBurstMetric {
  date: string;
  communicationCount: number;
  transactionVolumeINR: number;
  locationPings: number;
  totalEvents: number;
  anomalyFlag?: boolean;
}
