/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_EDIT_DETAILS_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
export interface RfpUiEditDetailPayload extends BaseModelPayload
{
   mediaPlanId:           number;         /// The pk of cbx_media_plans
   mbuHdrId:              number;         /// The pk of cbx_mp_mbu_hdrs
   mbuDtlId:              number;         /// The pk of cbx_mp_mbu_dtls
   commonMbuId:           number;         /// The pk of cbx_mp_common_mbus
   ggId:                  number;         /// The pk of cbx_geofootprint_geos
   geoProfileId:          number;         /// The wrap id in cbx_pm_forecast_wrap_dtls_mv
   fkSite:                number;         /// The id of the site
   wrapZoneId:            number;         /// ID of the wrap zone
   wrapZone:              string;         /// Name of the wrap zone
   productCd:             string;         /// The short code for the product
   productName:           string;         /// The full product name
   sfdcProductCode:       string;
   wrapPagePosition:      string;         /// The page position of the wrap chosen
   finishedSize:          string;         /// Finished size
   estimatedPieceWeight:  number;         /// Estimated piece weight
   vdpTypeCode:           string;         /// VDP Type
   geocode:               string;         /// The geography
   zip:                   string;         /// The zip code component of the geography
   atz:                   string;         /// The atz component of the geography
   cityName:              string;         /// The city / state of the geography
   household:             number;         /// When bought, hh_count_mbu otherwise hh_count_pref_ihd. If null, then hh_count_geo
   taHousehold:           number;         /// Households in the trade area
   distribution:          number;         /// The distribution (circ)
   addOnDistribution:     number;
   cpm:                   number;         /// Average MBU price (cost per thousand)
   investment:            number;         /// Spend with flat_fee added in
   addOnInvestment:       number;
   overallCoverage:       number;         /// Overall Coverage: circ / household count * 100
   taCoverage:            number;         /// Trade Area Coverage: TA (targeted) circ / TA (targeted) household count * 100
   distance:              number;         /// The distance of the geography to the site
   coverageDescDisplay:   string;         /// Abbreviated delivery method
   coverageDesc:          string;         /// Delivery method full name
   ownerGroup:            string;         /// Owner Group
   coverageFrequency:     string;         /// Coverage Frequency
   ihDate:                Date;           /// In home week start date
   ihDay:                 string;         /// In home day
   pricingMarket:         string;         /// Pricing market
   sdmId:                 number;         /// The id of the shared delivery market
   sdmName:               string;         /// Grouping of shared coverage areas
   variableId:            number;         /// Primary variable id
   primaryVariableName:   string;         /// Primary variable name
   variableContent:       string;         /// Primary variable contents, notably INDEX indicates an indexed value
   variableValue:         number;         /// Primary variable number value
   isSelected:            boolean;        /// If the user has selected this geography, then 1 else 0 (Default is_bought)
   isAddOn:               boolean;
   isActiveMbuCmn:        boolean;        /// Value of cbx_mp_common_mbus.is_active
   isActiveMbuHdr:        boolean;        /// Value of cbx_mp_mbu_hdrs.is_active
   isActiveMbuDtl:        boolean;        /// Value of cbx_mp_mbu_dtls.is_active
   isUsedInCbx:           boolean;        /// If the geography in mbu details then 1 else 0
   isBought:              boolean;        /// If opti bought this geography, then 1 else 0
   mbuPriceUom:           string;
   var1Name:              string;         /// Variable 1 name
   var1Content:           string;         /// Variable 1 contents, notably INDEX indicates an indexed value
   var1IsString:          number;         /// 0 = Not a string, 1 = Is a string
   var1IsNumber:          number;         /// 0 = Not a number, 1 = Is a number
   var1Value:             string;         /// Variable 1 number value
   var2Name:              string;         /// Variable 2 name
   var2Content:           string;         /// Variable 2 contents, notably INDEX indicates an indexed value
   var2IsString:          number;         /// 0 = Not a string, 1 = Is a string
   var2IsNumber:          number;         /// 0 = Not a number, 1 = Is a number
   var2Value:             string;         /// Variable 2 number value
   var3Name:              string;         /// Variable 3 name
   var3Content:           string;         /// Variable 3 contents, notably INDEX indicates an indexed value
   var3IsString:          number;         /// 0 = Not a string, 1 = Is a string
   var3IsNumber:          number;         /// 0 = Not a number, 1 = Is a number
   var3Value:             string;         /// Variable 3 number value
}