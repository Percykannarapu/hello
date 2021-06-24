/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_COMMON_MBUS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlan } from './MediaPlan';
import { MpCommonVersion } from './MpCommonVersion';
import { MediaPlanLine } from './MediaPlanLine';

export class MediaPlanCommonMbu extends BaseModel
{
   public commonMbuId:             number;         /// Common Mbu Id
   public createUser:              number;         /// Fk Create User
   public createDate:              Date;           /// Create Date
   public modifyUser:              number;         /// Fk Modify User
   public modifyDate:              Date;           /// Modify Date
   public commonMoId:              number;         /// Fk Common Mo Id
   public mediaPlanId:             number;         /// Media plan this mbu belongs to
   public advertiserInfoId:        number;         /// Captures advertiser information from the UI
   public allianceId:              number;         /// Fk Alliance Id
   public productCode:             string;         /// Product codes table with product specific infomation
   public mbuHdrId:                number;         /// Corresponding mbu header in CBX.CBX_MP_MBU_HDRS
   public inHomeGeoId:             number;         /// Key into CBX_EP_AVAILABILITY_MV
   public geoProfileId:            number;         /// Key into CBX_PM_PROFILES_MV
   public ownerGroup:              string;         /// Owner Group
   public pricingMarket:           string;         /// Pricing Market
   public deliveryMethod:          string;         /// Delivery Method
   public distributionMethod:      string;         /// Distribution Method
   public finishedSize:            string;         /// Finished Size
   public estimatedPieceWeight:    number;         /// Estimated Piece Weight
   public mbuId:                   string;         /// Mbu Id
   public mbuName:                 string;         /// Mbu Name
   public buySeq:                  number;         /// Buy Seq
   public mbuPrice:                number;         /// Mbu Price
   public mbuCirc:                 number;         /// Mbu Circ
   public mbuHhCount:              number;         /// Mbu Hh Count
   public mbuDeliveryType:         number;         /// Mbu Delivery Type
   public mbuScore:                number;         /// Mbu Score
   public atzCharge:               number;         /// Atz Charge
   public overlapZoneInd:          string;         /// Overlap Zone Ind
   public allianceType:            number;         /// Alliance Type
   public minVolumeReq:            number;         /// Min Volume Req
   public hasConflict:             number;         /// Has Conflicts
   public newsDeliveryType:        string;         /// News Delivery Type
   public editionTc:               string;         /// Edition Tc
   public mediaNum:                string;         /// Media Num
   public mediaOption:             string;         /// Media Option
   public wrapPagePositionCode:    string;         /// WRAP Page Positions
   public wrapAvailabilityCode:    string;         /// Wrap Availability Code
   public isAvailable:             boolean;        /// Is Available
   public bestDate:                Date;           /// Best Date
   public firstIhd:                Date;           /// First Ihd
   public secondIhd:               Date;           /// Second Ihd
   public pdi:                     number;         /// Pdi
   public isBestFoodDay:           boolean;        /// Is Best Food Day
   public matchesIhdDirection:     number;         /// Matches Ihd Direction
   public isPreferredDate:         boolean;        /// Is Preferred Date
   public weekly:                  number;         /// Weekly
   public anne:                    number;         /// Anne
   public isSelected:              boolean;        /// Is Selected
   public isActive:                boolean;        /// Is Active
   public mbuTargetedCirc:         number;         /// Mbu Targeted Circ
   public isBought:                boolean;        /// Is Bought
   public mbuHhCountPrefIhd:       number;         /// Mbu Hh Count Pref Ihd
   public flatFee:                 number;         /// Flat Fee
   public vdpTypeCode:             string;         /// VDP Types
   public entryPointCode:          string;         /// SOLO Entry Points
   public isIncluded:              boolean;        /// Is Included
   public sdmId:                   number;         /// Key into CBX_PM_SDMS_MV
   public sdmName:                 string;         /// Sdm Name
   public isBlended:               boolean;        /// Is Blended
   public prevMbuPrice:            number;         /// Prev Mbu Price
   public origMbuPrice:            number;         /// Orig Mbu Price
   public blendedPct:              number;         /// Blended Pct
   public mediaPlanGroupId:        number;         /// The group the media plan belongs to
   public coverageFrequency:       string;         /// Coverage frequency
   public commonVersionId:         number;         /// Version Id Sequence Generated Value
   public siteName:                string;         /// Site Name to flow to iConnect and Profile Manager
   public groupName:               string;         /// Group Name to flow to iConnect and Profile Manager
   public productAllocationId:     number;         /// Key into cbx_product_allocations
   public sfdcProductCode:         string;         /// Key into cbx_sfdc_products
   public mbuPriceUom:             string;
   public clientInvoicePromotion:  string;
   public clientPo:                string;
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public advertiserInfo:          AdvertiserInfo;               /// Captures advertiser information from the UI

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlan:               MediaPlan;                    /// Media plans for an advertiser info id / profile

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mpCommonVersion:         MpCommonVersion;              /// Version Information for media planning

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlanLine:           MediaPlanLine;                /// CBX.CBX_MP_MBU_HDRS

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlanCommonMbu>) {
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
         ['commonMbuId',              'number'],
         ['createUser',               'number'],
         ['createDate',               'Date'],
         ['modifyUser',               'number'],
         ['modifyDate',               'Date'],
         ['allianceId',               'number'],
         ['ownerGroup',               'string'],
         ['pricingMarket',            'string'],
         ['deliveryMethod',           'string'],
         ['distributionMethod',       'string'],
         ['finishedSize',             'string'],
         ['estimatedPieceWeight',     'number'],
         ['mbuId',                    'string'],
         ['mbuName',                  'string'],
         ['buySeq',                   'number'],
         ['mbuPrice',                 'number'],
         ['mbuCirc',                  'number'],
         ['mbuHhCount',               'number'],
         ['mbuDeliveryType',          'number'],
         ['mbuScore',                 'number'],
         ['atzCharge',                'number'],
         ['overlapZoneInd',           'string'],
         ['allianceType',             'number'],
         ['minVolumeReq',             'number'],
         ['hasConflict',              'number'],
         ['newsDeliveryType',         'string'],
         ['editionTc',                'string'],
         ['mediaNum',                 'string'],
         ['mediaOption',              'string'],
         ['wrapAvailabilityCode',     'string'],
         ['isAvailable',              'boolean'],
         ['bestDate',                 'Date'],
         ['firstIhd',                 'Date'],
         ['secondIhd',                'Date'],
         ['pdi',                      'number'],
         ['isBestFoodDay',            'boolean'],
         ['matchesIhdDirection',      'number'],
         ['isPreferredDate',          'boolean'],
         ['weekly',                   'number'],
         ['anne',                     'number'],
         ['isSelected',               'boolean'],
         ['isActive',                 'boolean'],
         ['mbuTargetedCirc',          'number'],
         ['isBought',                 'boolean'],
         ['mbuHhCountPrefIhd',        'number'],
         ['flatFee',                  'number'],
         ['isIncluded',               'boolean'],
         ['sdmName',                  'string'],
         ['isBlended',                'boolean'],
         ['prevMbuPrice',             'number'],
         ['origMbuPrice',             'number'],
         ['blendedPct',               'number'],
         ['mediaPlanGroupId',         'number'],
         ['coverageFrequency',        'string'],
         ['siteName',                 'string'],
         ['groupName',                'string'],
         ['productAllocationId',      'number'],
         ['sfdcProductCode',          'string'],
         ['mbuPriceUom',              'string'],
         ['clientInvoicePromotion',   'string'],
         ['clientPo',                 'string']
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
         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',           'AdvertiserInfo'],
         ['mediaPlan',                'MediaPlan'],
         ['mpCommonVersion',          'MpCommonVersion'],
         ['mediaPlanLine',            'mediaPlanLine'],
      ]);
   }
}
