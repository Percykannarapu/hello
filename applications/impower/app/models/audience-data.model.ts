import { VarSpecs } from 'app/services/target-audience-unified.service';
import { FieldContentTypeCodes } from '../impower-datastore/state/models/impower-model.enums';

export interface AudienceDataDefinition {
  audienceName: string;
  audienceIdentifier: string;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  exportNationally: boolean;
  allowNationalExport: boolean;
  selectedDataSet?: string;
  dataSetOptions?: { label: string, value: string }[];
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite';
  secondaryId?: string;
  audienceTAConfig?: AudienceTradeAreaConfig;
  fieldconte: FieldContentTypeCodes;
  requiresGeoPreCaching: boolean;
  sortOrder: number;
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
