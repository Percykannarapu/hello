/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_COMMON_MBUS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface MediaPlanCommonMbuPayload extends BaseModelPayload
{
   commonMbuId:             number;         /// Common Mbu Id
   createUser:              number;         /// Fk Create User
   createDate:              Date;           /// Create Date
   modifyUser:              number;         /// Fk Modify User
   modifyDate:              Date;           /// Modify Date
   commonMoId:              number;         /// Fk Common Mo Id
   mediaPlanId:             number;         /// Media plan this mbu belongs to
   advertiserInfoId:        number;         /// Captures advertiser information from the UI
   allianceId:              number;         /// Fk Alliance Id
   productCode:             string;         /// Product codes table with product specific infomation
   mbuHdrId:                number;         /// Corresponding mbu header in CBX.CBX_MP_MBU_HDRS
   inHomeGeoId:             number;         /// Key into CBX_EP_AVAILABILITY_MV
   geoProfileId:            number;         /// Key into CBX_PM_PROFILES_MV
   ownerGroup:              string;         /// Owner Group
   pricingMarket:           string;         /// Pricing Market
   deliveryMethod:          string;         /// Delivery Method
   distributionMethod:      string;         /// Distribution Method
   finishedSize:            string;         /// Finished Size
   estimatedPieceWeight:    number;         /// Estimated Piece Weight
   mbuId:                   string;         /// Mbu Id
   mbuName:                 string;         /// Mbu Name
   buySeq:                  number;         /// Buy Seq
   mbuPrice:                number;         /// Mbu Price
   mbuCirc:                 number;         /// Mbu Circ
   mbuHhCount:              number;         /// Mbu Hh Count
   mbuDeliveryType:         number;         /// Mbu Delivery Type
   mbuScore:                number;         /// Mbu Score
   atzCharge:               number;         /// Atz Charge
   overlapZoneInd:          string;         /// Overlap Zone Ind
   allianceType:            number;         /// Alliance Type
   minVolumeReq:            number;         /// Min Volume Req
   hasConflict:             number;         /// Has Conflicts
   newsDeliveryType:        string;         /// News Delivery Type
   editionTc:               string;         /// Edition Tc
   mediaNum:                string;         /// Media Num
   mediaOption:             string;         /// Media Option
   wrapPagePositionCode:    string;         /// WRAP Page Positions
   wrapAvailabilityCode:    string;         /// Wrap Availability Code
   isAvailable:             boolean;        /// Is Available
   bestDate:                Date;           /// Best Date
   firstIhd:                Date;           /// First Ihd
   secondIhd:               Date;           /// Second Ihd
   pdi:                     number;         /// Pdi
   isBestFoodDay:           boolean;        /// Is Best Food Day
   matchesIhdDirection:     number;         /// Matches Ihd Direction
   isPreferredDate:         boolean;        /// Is Preferred Date
   weekly:                  number;         /// Weekly
   anne:                    number;         /// Anne
   isSelected:              boolean;        /// Is Selected
   isActive:                boolean;        /// Is Active
   mbuTargetedCirc:         number;         /// Mbu Targeted Circ
   isBought:                boolean;        /// Is Bought
   mbuHhCountPrefIhd:       number;         /// Mbu Hh Count Pref Ihd
   flatFee:                 number;         /// Flat Fee
   vdpTypeCode:             string;         /// VDP Types
   entryPointCode:          string;         /// SOLO Entry Points
   isIncluded:              boolean;        /// Is Included
   sdmId:                   number;         /// Key into CBX_PM_SDMS_MV
   sdmName:                 string;         /// Sdm Name
   isBlended:               boolean;        /// Is Blended
   prevMbuPrice:            number;         /// Prev Mbu Price
   origMbuPrice:            number;         /// Orig Mbu Price
   blendedPct:              number;         /// Blended Pct
   mediaPlanGroupId:        number;         /// The group the media plan belongs to
   coverageFrequency:       string;         /// Coverage frequency
   commonVersionId:         number;         /// Version Id Sequence Generated Value
   siteName:                string;         /// Site Name to flow to iConnect and Profile Manager
   groupName:               string;         /// Group Name to flow to iConnect and Profile Manager
   productAllocationId:     number;         /// Key into cbx_product_allocations
   sfdcProductCode:         string;         /// Key into cbx_sfdc_products
   mbuPriceUom:             string;
   clientInvoicePromotion:  string;
   clientPo:                string;

}