export interface MapMarkerLocation {
  id: string;
  name: string;
  category: 'Crime Scene' | 'Suspect Location' | 'Cell Tower' | 'Warehouse' | 'Port / Terminal' | 'Financial Branch';
  latitude: number;
  longitude: number;
  accuracyRadiusMeters?: number;
  timestamp?: string;
  address: string;
  associatedEntities: {
    id: string;
    label: string;
    type: string;
  }[];
  notes?: string;
  cellTowerDetails?: {
    towerId: string;
    lac: string;
    azimuthDegrees: number;
    cdrCount: number;
  };
}
