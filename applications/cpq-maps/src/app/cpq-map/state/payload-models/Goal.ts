/** A MEDIAPLANNING domain class representing the table: CBX.CBX_GOALS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface GoalPayload extends BaseModelPayload
{
   goalCode:         string;         /// Goal Cd
   goal:             string;         /// Goal
   goalDescription:  string;         /// Description
   sortOrder:        number;         /// Sort Order
   isActiveGoal:     boolean;        /// Is Active
}