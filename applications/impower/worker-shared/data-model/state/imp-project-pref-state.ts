import { ImpProjectPrefPayload } from '../payloads/imp-project-pref-payload';
import { BaseModelState } from './base-model-state';

export class ImpProjectPrefState extends BaseModelState {
  public projectPrefId:  number;         /// Primary Key
  public projectId:      number;         /// Foreign Key to IMP_PROJECTS
  public prefGroup:      string;         /// Identifier to load preferences as a group
  public prefType:       string;         /// The type of the preference, such as STRING, NUMBER
  public pref:           string;         /// The key code to identify the preference
  public val:            string;         /// The value of the preference. Must be less than 4kb
  public largeVal:       string;         /// For values larger than 4kb
  public isActive:       boolean;        /// 1 = Preference Active, 0 = Preference InActive

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpProjectPrefPayload>) {
    super(data);
  }
}
