import { AudienceTradeAreaConfig } from 'app/models/audience-data.model';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';

export interface Audience {
  audienceIdentifier: string;
  audienceName: string;
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
