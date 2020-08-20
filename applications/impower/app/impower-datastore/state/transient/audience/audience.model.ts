import { AudienceTradeAreaConfig } from 'app/models/audience-data.model';
import { VarSpecs } from 'app/services/target-audience-unified.service';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';

export interface Audience {
  audienceIdentifier: string;
  audienceName: string;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  disableUISplit?: boolean;
  exportNationally: boolean;
  allowNationalExport: boolean;
  nationalCsvTransform?: (fieldName: string) => { name: string, field: string }[];
  selectedDataSet?: string;
  dataSetOptions?: { label: string, value: string }[];
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite'  ;
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
