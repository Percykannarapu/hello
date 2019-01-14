/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_PRODUCT_ALLOCATIONS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { PpToWrapPage } from './PpToWrapPage';

export class ProductAllocation extends BaseModel
{
   public productAllocationId:   number;         /// Primary key uniquely identifying a product allocation row
   public createUser:            number;         /// User to create the row
   public createDate:            Date;           /// Date/Time row was created
   public modifyUser:            number;         /// User to modify the row
   public modifyDate:            Date;           /// Date/Time row was modified
   public advertiserInfoId:      number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   public productCode:           string;         /// Foreign key to cbx_products.product_cd
   public estimatedCpm:          number;         /// Estimated CPM for the product
   public pctBudgetAllocated:    number;         /// Percentage of budget allocated
   public npSundayDailyEd:       string;         /// Newspaper sunday daily edition
   public smIncludeAnne:         number;         /// Shared mail include anne
   public smIncludeNonWeekly:    number;         /// Shared mail include non-weekly
   public dtNumFlight:           number;         /// Display number of flights
   public isActive:              boolean;        /// 1 = Active, 0 = InActive
   public smAnneCpm:             number;         /// Shared mail anne cpm
   public buySeq:                number;         /// Buying sequence
   public atzCharge:             number;         /// ATZ charge
   public emailIncludeAtz:       number;         /// Email include ATZ charge
   public wrapIncludeNonWeekly:  number;         /// Wrap include non-weekly
   public customerNumber:        string;         /// Customer number
   public smIncludeVdp:          number;         /// Sm Include Vdp
   public wrapPagePriorityCode:  string;         /// FOREIGN KEY to CBX_WRAP_PAGE_PRIORITY
   public isRunAvail:            boolean;        /// Is Run Avail
   public finishedSize:          string;         /// Fk Finished Size
   public pieceWeight:           number;         /// Piece Weight
   public flatFee:               number;         /// Flat Fee
   public vdpTypeCode:           string;         /// Fk Vdp Type Cd
   public entryPointCode:        string;         /// Fk Entry Point Cd
   public sfdcProductCode:       string;

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public ppToWrapPages:      Array<number> = new Array<number>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public advertiserInfo:          AdvertiserInfo;               /// Captures advertiser information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ProductAllocation>) {
      super();
      Object.assign(this, data);
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
         ['productAllocationId',      'number'],
         ['createUser',               'number'],
         ['createDate',               'Date'],
         ['modifyUser',               'number'],
         ['modifyDate',               'Date'],
         ['estimatedCpm',             'number'],
         ['pctBudgetAllocated',       'number'],
         ['npSundayDailyEd',          'string'],
         ['smIncludeAnne',            'number'],
         ['smIncludeNonWeekly',       'number'],
         ['dtNumFlight',              'number'],
         ['isActive',                 'boolean'],
         ['smAnneCpm',                'number'],
         ['buySeq',                   'number'],
         ['atzCharge',                'number'],
         ['emailIncludeAtz',          'number'],
         ['wrapIncludeNonWeekly',     'number'],
         ['customerNumber',           'string'],
         ['smIncludeVdp',             'number'],
         ['isRunAvail',               'boolean'],
         ['pieceWeight',              'number'],
         ['flatFee',                  'number']
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
         ['entryPoint',               'EntryPoint'],
         ['pricingFinishedSize',      'PricingFinishedSize'],
         ['product',                  'Product'],
         ['sfdcProduct',              'SfdcProduct'],
         ['vdpType',                  'VdpType'],
         ['wrapPagePriority',         'WrapPagePriority'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',           'AdvertiserInfo'],
         ['entryPoint',               'EntryPoint'],
         ['pricingFinishedSize',      'PricingFinishedSize'],
         ['product',                  'Product'],
         ['sfdcProduct',              'SfdcProduct'],
         ['vdpType',                  'VdpType'],
         ['wrapPagePriority',         'WrapPagePriority'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}