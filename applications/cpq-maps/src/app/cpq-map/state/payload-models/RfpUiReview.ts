/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_REVIEW_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
export interface RfpUiReviewPayload extends BaseModelPayload
{
   mediaPlanGroupId:        number;
   mediaPlanId:             number;
   siteId:                  number;
   siteIdDisplay:           string;
   siteName:                string;
   siteAddress:             string;
   siteCitySt:              string;
   siteZip:                 string;
   siteHomeGeocode:         string;
   productCd:               string;
   productName:             string;
   sfdcProductCode:         string;
   sfdcProductName:         string;
   pricingMarket:           string;
   deliveryMethod:          string;
   deliveryMethodAbbr:      string;
   distributionMethod:      string;
   ownerGroup:              string;
   ihw:                     Date;
   ihd:                     string;
   wrapPagePosition:        string;
   finishedSize:            string;
   estimatedPieceWeight:    number;
   vdpTypeCode:             string;
   avgCpm:                  number;
   taHousehold:             number;
   distributionPossible:    number;
   taDistributionPossible:  number;
   distribution:            number;
   taDistribution:          number;
   investment:              number;
   isAddOn:                 boolean;
   addonDistribution:       number;
   addonTaDistribution:     number;
   addonInvestment:         number;
   coverage:                number;
   distEfficiency:          number;
}