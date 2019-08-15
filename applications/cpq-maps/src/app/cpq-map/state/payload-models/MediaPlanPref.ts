import { BaseModelPayload } from './BaseModel';

export interface MediaPlanPref extends BaseModelPayload
{
  prefId:       number;         /// Primary Key
  mediaPlanId:  number;         /// Foreign Key to CBX_MEDIA_PLANS
  prefGroup:    string;         /// Identifier to load preferences as a group
  prefType:     string;         /// The type of the preference, such as STRING, NUMBER
  pref:         string;         /// The key code to identify the preference
  val:          string;         /// The value of the preference. Must be less than 4kb
  largeVal:     string;         /// For values larger than 4kb
  isActive:     boolean;        /// 1 = Preference Active, 0 = Preference InActive
}
