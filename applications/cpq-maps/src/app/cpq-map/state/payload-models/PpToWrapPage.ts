/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_PP_TO_WRAP_PAGES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface PpToWrapPagePayload extends BaseModelPayload
{
   pptwpId:               number;         /// Pptwp Id
   createUser:            number;         /// Fk Create User
   createDate:            Date;           /// Create Date
   modifyUser:            number;         /// Fk Modify User
   modifyDate:            Date;           /// Modify Date
   productAllocationId:   number;         /// Fk Product Allocation Id
   wrapPagePositionCode:  string;         /// Fk Wrap Page Position Cd
   priority:              number;         /// Priority
   rateOverride:          number;         /// Rate Override
   anneRateOverride:      number;         /// Anne Rate Override
   sfdcProductCode:       string;
}