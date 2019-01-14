/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_TARGET_AUDIENCE_PREFS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';


export interface TargetAudiencePrefPayload extends BaseModelPayload
{
   targetAudiencePrefId:  number;         /// Target Audience Pref Id
   createUser:            number;         /// Fk Create User
   createDate:            Date;           /// Create Date
   modifyUser:            number;         /// Fk Modify User
   modifyDate:            Date;           /// Modify Date
   advertiserInfoId:      number;         /// Fk Advertiser Info Id
   variableSortOrder:     string;         /// Variable Sort Order
   filterOperationCode:   string;         /// Fk Filter Operation Cd
   variableFilterValue:   string;         /// Variable Filter Value
   isActive:              boolean;        /// Is Active
   isTradeAreaLimited:    boolean;        /// Is Trade Area Limited
   variableId:            number;         /// Fk Variable Id
   variableName:          string;         /// Variable Name
}