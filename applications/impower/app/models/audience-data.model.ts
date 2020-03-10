import { FieldContentTypeCodes } from '../impower-datastore/state/models/impower-model.enums';

export interface AudienceDataDefinition {
  audienceName: string;
  audienceIdentifier: string;
  showOnMap: boolean;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  disableUISplit?: boolean;
  exportNationally: boolean;
  allowNationalExport: boolean;
  nationalCsvTransform?: (fieldName: string) => { name: string, field: string }[];
  selectedDataSet?: string;
  dataSetOptions?: { label: string, value: string }[];
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Combine/Convert' | 'Composite';
  secondaryId?: string;
  audienceTAConfig?: AudienceTradeAreaConfig;
  fieldconte: FieldContentTypeCodes;
  requiresGeoPreCaching: boolean;
  seq: number;
  isCombined?: boolean;
  combinedAudiences?: Array<string>;
  combinedVariableNames?: string;
}

export interface AudienceTradeAreaConfig {
  digCategoryId: number;
  analysisLevel: string;
  scoreType: string;
  minRadius: number;
  maxRadius: number;
  weight: number;
  locations: Array<AudienceTradeareaLocation>;
  includeMustCover: boolean;
  audienceName?: string;
}

export interface AudienceTradeareaLocation {
  LOCATIONNAME: string;
  XCOORD: number;
  YCOORD: number;
  HOMEGEOCODE: string;
}
