/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_EDIT_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
export interface RfpUiEditPayload extends BaseModelPayload
{
   siteId:                number;
   siteName:              string;
   siteAddress:           string;
   siteCitySt:            string;
   siteZip:               string;
   siteLat:               number;
   siteLong:              number;
   productCd:             string;
   productName:           string;
   finishedSize:          string;
   estimatedPieceWeight:  number;
   ownerGroup:            string;
   vdpTypeCode:           string;
   mbuPriceUom:           string;
   sfdcProductCode:       string;
   detailPageInd:         number;
   taHousehold:           number;
   taDistribution:        number;
   distribution:          number;
   investment:            number;
   isAddOn:               boolean;
   addonDistribution:     number;
   addonTaDistribution:   number;
   addonInvestment:       number;
   avgCpm:                number;
   coverage:              number;
}