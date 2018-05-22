
export interface AudienceDataDefinition {
  audienceName: string;
  audienceIdentifier: string;
  showOnMap: boolean;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom';
}
