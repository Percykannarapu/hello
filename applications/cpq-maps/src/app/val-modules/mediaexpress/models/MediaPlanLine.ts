/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_MBU_HDRS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlan } from './MediaPlan';
import { MediaPlanCommonMbu } from './MediaPlanCommonMbu';
import { MediaPlanLineDetail } from './MediaPlanLineDetail';

export class MediaPlanLine extends BaseModel
{
   public mbuHdrId:              number;         /// Primary key indicating a particular MBU
   public createUser:            number;         /// User to create the row
   public createDate:            Date;           /// Date/Time row was created
   public modifyUser:            number;         /// User to modify the row
   public modifyDate:            Date;           /// Date/Time row was modified
   public mediaPlanId:           number;         /// Foreign key to cbx_media_plans.media_plan_id
   public advertiserInfoId:      number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   public productCode:           string;         /// Foreign key to cbx_products.product_cd
   public geoProfileId:          number;         /// ID identifying the geo, normally used to tie to a forecast mv
   public allianceId:            number;         /// Newspaper alliance ID
   public partnerAccountId:      number;         /// Newspaper partner account ID
   public allianceType:          number;         /// Newspaper alliance type
   public mediaOption:           string;         /// An input for optimization
   public mbuName:               string;         /// Name given to identify the MBU
   public mediaNum:              string;         /// Newspaper identifier #, sourced to media_general in HBM
   public editionTc:             string;         /// Newspaper edition
   public circDistributionTc:    string;         /// Circulation distribution type code (HOME,STRT,HDSS)
   public circTc:                string;         /// Circulation type code
   public validFromDate:         Date;           /// Normally from forecast mv to find dates of interest
   public validToDate:           Date;           /// Normally from forecast mv to find dates of interest
   public weekly:                number;         /// Shared mail weekly indicator
   public anne:                  number;         /// Shared mail anne indicator
   public mbuHhCount:            number;         /// MBU household count
   public mbuTargetedHhCount:    number;         /// MBU targeted household count
   public mbuCirc:               number;         /// MBU circulation
   public mbuTargetedCirc:       number;         /// MBU targeted circulation
   public mbuPrice:              number;         /// MBU price
   public atzCharge:             number;         /// ATZ charge
   public digitalCharge:         number;         /// Digital charge
   public mbuScore:              number;         /// MBU scoring value for optimization
   public efficiency:            number;         /// How well the circulation covers the desired HHs
   public penetration:           number;         /// How much of the circulation bought was actually desired
   public reasonCode:            string;         /// The reason given for setting is_active = 0
   public rank:                  number;         /// Ranking value to choose an MBU
   public isActive:              boolean;        /// 1 = Active, 0 = InActive
   public mbuType:               string;         /// Indicates if the MBU is digital or print
   public buySeq:                number;         /// Buying sequence
   public hasConflict:           number;         /// Are there newspaper alliance conflicts
   public newsDeliveryType:      number;         /// Newspaper delivery type
   public minVolumeReq:          number;         /// Newspaper minimum volume required
   public circBuyingOption:      string;         /// Newspaper circulation buying option
   public mbuDeliveryType:       number;         /// An input to optimization in opt_i_media_buyable_units
   public overlapZoneInd:        string;         /// Overlap zone indicator
   public sharedHhcPossible:     number;         /// Shared household count possible. See cbx_mp_inputs_tmp.is_single_date
   public anneHhcPossible:       number;         /// Anne household count possible. See cbx_mp_inputs_tmp.is_single_date
   public sharedHhcScheduled:    number;         /// Shared household count scheduled. See cbx_mp_inputs_tmp.is_single_date
   public anneHhcScheduled:      number;         /// Anne household count sscheduled. See cbx_mp_inputs_tmp.is_single_date
   public hasHomeGeo:            number;         /// Does the MBU include a home geocode
   public zoneDesc50:            string;         /// Newspaper zone description
   public wrapPagePositionCode:  string;         /// FOREIGN KEY to CBX_WRAP_PAGE_POSITIONS
   public wrapAvailabilityCode:  string;         /// Wrap Availability Code
   public inHomeGeoId:           number;         /// FOREIGN KEY to ADVOEP_PROD_GEO_SCHEDULE
   public bestDate:              Date;           /// Best Date, used in PDI Calculation
   public isBestFoodDay:         boolean;        /// Matches IHD Direction, used in PDI Calculation
   public matchesIhdDirection:   number;         /// Matches Ihd Direction
   public isPreferredDate:       boolean;        /// Is preferred date, used in PDI Calculation
   public firstIhd:              Date;           /// 1st in home date
   public secondIhd:             Date;           /// 2nd in home date
   public pdi:                   number;         /// PDI Calculation
   public pdiTierNum:            number;         /// PDI TIER NUM
   public ihwId:                 number;         /// Fk Ihw Id
   public deliveryMethod:        string;         /// Delivery Method
   public isBlended:             boolean;        /// 0 or 1: A 1 indicates that the MBU contains more than one delivery_method, for example: PCD/MAIL (see CBX_ZONE_BLENDED_ZIPS_MV)
   public blendedPct:            number;         /// Blended Pct
   public mediaPlanGroupId:      number;         /// Fk Media Plan Group Id
   public coverageFrequency:     string;
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public advertiserInfo:          AdvertiserInfo;            /// Captures advertiser information from the UI

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlan:               MediaPlan;                 /// Media plans for an advertiser info id / profile

   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getMpCommonMbus(): ReadonlyArray<MediaPlanCommonMbu> {
      let _result: Array<MediaPlanCommonMbu> = new Array<MediaPlanCommonMbu>();
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getMpMbuDtls(): ReadonlyArray<MediaPlanLineDetail> {
      let _result: Array<MediaPlanLineDetail> = new Array<MediaPlanLineDetail>();
      return _result;
   }


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlanLine>) {
      super();
      Object.assign(this, data);
   }

   // Set tree property and push it down the hierarchy
   public setTreeProperty(propName: string, propValue: any)
   {
      if (!this.hasOwnProperty(propName)) {
         Object.defineProperty(this, propName, {
            enumerable: false,
            configurable: true,
            writable: true
         });
      }
      this[propName] = propValue;
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
   }

   // Convert JSON objects into Models
   public convertToModel()
   {

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['mbuHdrId',                 'number'],
         ['createUser',               'number'],
         ['createDate',               'Date'],
         ['modifyUser',               'number'],
         ['modifyDate',               'Date'],
         ['geoProfileId',             'number'],
         ['allianceId',               'number'],
         ['partnerAccountId',         'number'],
         ['allianceType',             'number'],
         ['mediaOption',              'string'],
         ['mbuName',                  'string'],
         ['mediaNum',                 'string'],
         ['editionTc',                'string'],
         ['circDistributionTc',       'string'],
         ['circTc',                   'string'],
         ['validFromDate',            'Date'],
         ['validToDate',              'Date'],
         ['weekly',                   'number'],
         ['anne',                     'number'],
         ['mbuHhCount',               'number'],
         ['mbuTargetedHhCount',       'number'],
         ['mbuCirc',                  'number'],
         ['mbuTargetedCirc',          'number'],
         ['mbuPrice',                 'number'],
         ['atzCharge',                'number'],
         ['digitalCharge',            'number'],
         ['mbuScore',                 'number'],
         ['efficiency',               'number'],
         ['penetration',              'number'],
         ['reasonCode',               'string'],
         ['rank',                     'number'],
         ['isActive',                 'boolean'],
         ['mbuType',                  'string'],
         ['buySeq',                   'number'],
         ['hasConflict',              'number'],
         ['newsDeliveryType',         'number'],
         ['minVolumeReq',             'number'],
         ['circBuyingOption',         'string'],
         ['mbuDeliveryType',          'number'],
         ['overlapZoneInd',           'string'],
         ['sharedHhcPossible',        'number'],
         ['anneHhcPossible',          'number'],
         ['sharedHhcScheduled',       'number'],
         ['anneHhcScheduled',         'number'],
         ['hasHomeGeo',               'number'],
         ['zoneDesc50',               'string'],
         ['wrapAvailabilityCode',     'string'],
         ['isAvailable',              'boolean'],
         ['bestDate',                 'Date'],
         ['isBestFoodDay',            'boolean'],
         ['matchesIhdDirection',      'number'],
         ['isPreferredDate',          'boolean'],
         ['firstIhd',                 'Date'],
         ['secondIhd',                'Date'],
         ['pdi',                      'number'],
         ['pdiTierNum',               'number'],
         ['ihwId',                    'number'],
         ['deliveryMethod',           'string'],
         ['isBlended',                'boolean'],
         ['blendedPct',               'number'],
         ['mediaPlanGroupId',         'number'],
         ['coverageFrequency',        'string']
         ]);
   }

   /**
    * Produces a map of this classes relationships and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getRelationships () : Map<string, string>
   {
      return new Map([
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',           'AdvertiserInfo'],
         ['mediaPlan',                'MediaPlan'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',           'AdvertiserInfo'],
         ['mediaPlan',                'MediaPlan'],

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['mediaPlanCommonMbu',       'Array<MediaPlanCommonMbu>'],
         ['mediaPlanLineDetail',      'Array<MediaPlanLineDetail>'],
      ]);
   }
}
