/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_EDIT_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface RfpUiEditWrapPayload extends BaseModelPayload
{
   isSelected:          boolean;
   commonMbuId:         number;
   siteId:              number;
   siteName:            string;
   siteAddress:         string;
   siteCitySt:          string;
   wrapZoneId:          number;
   wrapZone:            string;
   productCd:           string;
   coverageFrequency:   string;
   ownerGroup:          string;
   wrapProductName:     string;
   wrapPagePosition:    string;
   primaryVariableName: string;
   variableContents:    string;
   variableValue:       number;
   taHouseholds:        number;
   taDistribution:      number;
   distribution:        number;
   avgCpm:              number;
   investment:          number;
   wrapEfficiency:      number;

}