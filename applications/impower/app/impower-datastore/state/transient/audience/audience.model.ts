import { AudienceTradeAreaConfig } from 'app/models/audience-data.model';
import { FieldContentTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import { VarSpecs } from 'app/services/target-audience-unified.service';

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
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite'  ;
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
