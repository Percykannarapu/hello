import { BaseModelPayload } from './base-model-payload';

export interface ImpProjectPrefPayload extends BaseModelPayload {
   projectPrefId:  number;  /// Primary Key
   projectId:      number;
   prefGroup:      string;
   prefType:       string;
   pref:           string;
   val:            string;
   largeVal:       string;
   isActive:       boolean;
}
