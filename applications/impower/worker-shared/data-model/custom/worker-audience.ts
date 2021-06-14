import { FieldContentTypeCodes } from '../impower.data-model.enums';

export interface WorkerAudience {
  audienceIdentifier: string;
  audienceName: string;
  audienceSourceName: string;
  audienceSourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite'  ;
  fieldconte: FieldContentTypeCodes;
  sortOrder: number;
}
