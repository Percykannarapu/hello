/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_MBU_HDRS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface MediaPlanLinePayload extends BaseModelPayload
{
   mbuHdrId:              number;         /// Primary key indicating a particular MBU
   createUser:            number;         /// User to create the row
   createDate:            Date;           /// Date/Time row was created
   modifyUser:            number;         /// User to modify the row
   modifyDate:            Date;           /// Date/Time row was modified
   mediaPlanId:           number;         /// Foreign key to cbx_media_plans.media_plan_id
   advertiserInfoId:      number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   productCode:           string;         /// Foreign key to cbx_products.product_cd
   geoProfileId:          number;         /// ID identifying the geo, normally used to tie to a forecast mv
   allianceId:            number;         /// Newspaper alliance ID
   partnerAccountId:      number;         /// Newspaper partner account ID
   allianceType:          number;         /// Newspaper alliance type
   mediaOption:           string;         /// An input for optimization
   mbuName:               string;         /// Name given to identify the MBU
   mediaNum:              string;         /// Newspaper identifier #, sourced to media_general in HBM
   editionTc:             string;         /// Newspaper edition
   circDistributionTc:    string;         /// Circulation distribution type code (HOME,STRT,HDSS)
   circTc:                string;         /// Circulation type code
   validFromDate:         Date;           /// Normally from forecast mv to find dates of interest
   validToDate:           Date;           /// Normally from forecast mv to find dates of interest
   weekly:                number;         /// Shared mail weekly indicator
   anne:                  number;         /// Shared mail anne indicator
   mbuHhCount:            number;         /// MBU household count
   mbuTargetedHhCount:    number;         /// MBU targeted household count
   mbuCirc:               number;         /// MBU circulation
   mbuTargetedCirc:       number;         /// MBU targeted circulation
   mbuPrice:              number;         /// MBU price
   atzCharge:             number;         /// ATZ charge
   digitalCharge:         number;         /// Digital charge
   mbuScore:              number;         /// MBU scoring value for optimization
   efficiency:            number;         /// How well the circulation covers the desired HHs
   penetration:           number;         /// How much of the circulation bought was actually desired
   reasonCode:            string;         /// The reason given for setting is_active = 0
   rank:                  number;         /// Ranking value to choose an MBU
   isActive:              boolean;        /// 1 = Active, 0 = InActive
   mbuType:               string;         /// Indicates if the MBU is digital or print
   buySeq:                number;         /// Buying sequence
   hasConflict:           number;         /// Are there newspaper alliance conflicts
   newsDeliveryType:      number;         /// Newspaper delivery type
   minVolumeReq:          number;         /// Newspaper minimum volume required
   circBuyingOption:      string;         /// Newspaper circulation buying option
   mbuDeliveryType:       number;         /// An input to optimization in opt_i_media_buyable_units
   overlapZoneInd:        string;         /// Overlap zone indicator
   sharedHhcPossible:     number;         /// Shared household count possible. See cbx_mp_inputs_tmp.is_single_date
   anneHhcPossible:       number;         /// Anne household count possible. See cbx_mp_inputs_tmp.is_single_date
   sharedHhcScheduled:    number;         /// Shared household count scheduled. See cbx_mp_inputs_tmp.is_single_date
   anneHhcScheduled:      number;         /// Anne household count sscheduled. See cbx_mp_inputs_tmp.is_single_date
   hasHomeGeo:            number;         /// Does the MBU include a home geocode
   zoneDesc50:            string;         /// Newspaper zone description
   wrapPagePositionCode:  string;         /// FOREIGN KEY to CBX_WRAP_PAGE_POSITIONS
   wrapAvailabilityCode:  string;         /// Wrap Availability Code
   inHomeGeoId:           number;         /// FOREIGN KEY to ADVOEP_PROD_GEO_SCHEDULE
   bestDate:              Date;           /// Best Date, used in PDI Calculation
   isBestFoodDay:         boolean;        /// Matches IHD Direction, used in PDI Calculation
   matchesIhdDirection:   number;         /// Matches Ihd Direction
   isPreferredDate:       boolean;        /// Is preferred date, used in PDI Calculation
   firstIhd:              Date;           /// 1st in home date
   secondIhd:             Date;           /// 2nd in home date
   pdi:                   number;         /// PDI Calculation
   pdiTierNum:            number;         /// PDI TIER NUM
   ihwId:                 number;         /// Fk Ihw Id
   deliveryMethod:        string;         /// Delivery Method
   isBlended:             boolean;        /// 0 or 1: A 1 indicates that the MBU contains more than one delivery_method, for example: PCD/MAIL (see CBX_ZONE_BLENDED_ZIPS_MV)
   blendedPct:            number;         /// Blended Pct
   mediaPlanGroupId:      number;         /// Fk Media Plan Group Id
   coverageFrequency:     string;
}