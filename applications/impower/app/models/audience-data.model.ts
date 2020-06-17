import { FieldContentTypeCodes } from '../impower-datastore/state/models/impower-model.enums';
import { VarSpecs } from 'app/services/target-audience-unified.service';

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
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite';
  secondaryId?: string;
  audienceTAConfig?: AudienceTradeAreaConfig;
  fieldconte: FieldContentTypeCodes;
  requiresGeoPreCaching: boolean;
  seq: number;
  isCombined?: boolean;
  isComposite?: boolean;
  combinedAudiences?: Array<string>;
  combinedVariableNames?: string;
  compositeSource?: Array<VarSpecs>;
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
