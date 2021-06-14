import { VarSpecs } from 'app/models/audience-data.model';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';

export interface Audience {
  audienceIdentifier: string;
  audienceName: string;
  showOnGrid: boolean;
  exportInGeoFootprint: boolean;
  disableUISplit?: boolean;
  exportNationally: boolean;
  allowNationalExport: boolean;
  selectedDataSet?: string;
  dataSetOptions?: { label: string, value: string }[];
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite'  ;
  fieldconte: FieldContentTypeCodes;
  requiresGeoPreCaching: boolean;
  sortOrder: number;
  isCombined?: boolean;
  isComposite?: boolean;
  combinedAudiences?: Array<string>;
  combinedVariableNames?: string;
  compositeSource?: Array<VarSpecs> | Array<string>;
}
