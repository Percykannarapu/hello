import { ImpGeofootprintLocation } from "../val-modules/targeting/models/ImpGeofootprintLocation";

export interface AudienceDataDefinition {
  audienceName: string;
  audienceIdentifier: string;
  showOnMap: boolean;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  exportNationally: boolean;
  allowNationalExport: boolean;
  nationalCsvTransform?: (fieldName: string) => { name: string, field: string }[];
  selectedDataSet?: string;
  dataSetOptions?: { label: string, value: string }[];
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom';
  secondaryId?: string;
  audienceTAConfig?: AudienceTradeAreaConfig;
}

export interface AudienceTradeAreaConfig {
  digCategoryId: number;
  analysisLevel: string;
  scoreType: string;
  minRadius: number;
  maxRadius: number;
  weight: number;
  locations: Array<AudienceTradeareaLocation>;
}

export interface AudienceTradeareaLocation {
  LOCATIONNAME: string;
  XCOORD: number;
  YCOORD: number;
  HOMEGEOCODE: string;
}
