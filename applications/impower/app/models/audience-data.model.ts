import { FieldContentTypeCodes } from '../impower-datastore/state/models/impower-model.enums';

export interface AudienceDataDefinition {
  audienceName: string;
  audienceIdentifier?: string;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  exportNationally: boolean;
  allowNationalExport: boolean;
  selectedDataSet?: string;
  dataSetOptions?: { label: string, value: string }[];
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite';
  fieldconte: FieldContentTypeCodes;
  requiresGeoPreCaching: boolean;
  sortOrder?: number;
  isCombined?: boolean;
  isComposite?: boolean;
  combinedAudiences?: Array<string>;
  combinedVariableNames?: string;
  compositeSource?: Array<VarSpecs> | Array<string>;
}

export interface VarListItem {
  id: number;
  desc: string;
  source: string;
  base: string;
  // source: 'Interest' | 'In-Market' | 'Vlh' | 'Pixel' | 'Offline' |'Combined' | 'Composite' | 'Convert';
  // base: 'DMA' | 'NAT' | 'ALL' ;
  combineSource?: number[];
  compositeSource?: VarSpecs[];
}

export interface UnifiedPayload {
  geoType: string;
  transactionId: number;
  deleteTransaction: boolean;
  chunks: number;
  vars: VarListItem[];
}

export interface VarSpecs {
  id: number;
  pct: number;
  base?: string;
}

export interface OnlineBulkDownloadDataResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
  attrs: Map<string, string>;
}

export interface UnifiedResponse {
  categories: { [key: number] : string; };
  counts: { [key: number] : number };
  issues: {
    ERROR: string[];
    WARN: string[];
  };
  records: string;
  rows: UnifiedRow[];
}

export interface UnifiedRow {
  geocode: string;
  variables: {
    [key: string] : number
  };
}
