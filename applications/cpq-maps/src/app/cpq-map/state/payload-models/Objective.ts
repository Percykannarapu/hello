/** A MEDIAPLANNING domain class representing the table: CBX.CBX_OBJECTIVES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface ObjectivePayload extends BaseModelPayload
{
   objectiveCode:  string;         /// Objective Cd
   createUser:     number;         /// Fk Create User
   createDate:     Date;           /// Create Date
   modifyUser:     number;         /// Fk Modify User
   modifyDate:     Date;           /// Modify Date
   objective:      string;         /// Objective
   description:    string;         /// Description
   sortOrder:      number;         /// Sort Order
   isActive:       boolean;        /// Is Active
}