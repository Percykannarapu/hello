/** A MEDIAPLANNING domain class representing the table: IMPOWER.IMP_PRODUCT_ALLOCATIONS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { EntryPoint } from '../../mediaexpress/models/EntryPoint';
import { PricingFinishedSize } from '../../mediaexpress/models/PricingFinishedSize';
import { SfdcProduct } from '../../mediaexpress/models/SfdcProduct';
import { VdpType } from '../../mediaexpress/models/VdpType';
import { WrapPagePriority } from '../../mediaexpress/models/WrapPagePriority';
import { ImpProduct } from './ImpProduct';
import { ImpProject } from '../../targeting/models/ImpProject';

export class ImpProductAllocation
{
   public productAllocationId:     number;                    /// Primary key uniquely identifying a product allocation row
   public createUser:              number;                    /// User to create the row
   public createDate:              Date;                      /// Date/Time row was created
   public modifyUser:              number;                    /// User to modify the row
   public modifyDate:              Date;                      /// Date/Time row was modified
   public estimatedCpm:            number;                    /// Estimated CPM for the product
   public pctBudgetAllocated:      number;                    /// Percentage of budget allocated
   public npSundayDailyEd:         string;                    /// Newspaper sunday daily edition
   public smIncludeAnne:           number;                    /// Shared mail include anne
   public smIncludeNonWeekly:      number;                    /// Shared mail include non-weekly
   public dtNumFlight:             number;                    /// Display number of flights
   public isActive:                number;                    /// 1 = Active, 0 = InActive
   public smAnneCpm:               number;                    /// Shared mail anne cpm
   public buySeq:                  number;                    /// Buying sequence
   public atzCharge:               number;                    /// ATZ charge
   public emailIncludeAtz:         number;                    /// Email include ATZ charge
   public wrapIncludeNonWeekly:    number;                    /// Wrap include non-weekly
   public customerNumber:          string;                    /// Customer number
   public smIncludeVdp:            number;                    /// Sm Include Vdp
   public isRunAvail:              number;                    /// Is Run Avail
   public pieceWeight:             number;                    /// Piece Weight
   public flatFee:                 number;                    /// Flat Fee

   // IMPOWER.IMP_PRODUCT_ALLOCATIONS - MANY TO ONE RELATIONSHIP MEMBERS
   // ------------------------------------------------------------------
   public entryPointCode:          EntryPoint;                /// SOLO Entry Points
   public finishedSize:            PricingFinishedSize;      
   public sfdcProductCode:         SfdcProduct;              
   public vdpTypeCode:             VdpType;                   /// VDP Types
   public wrapPagePriorityCode:    WrapPagePriority;          /// WRAP Page Priorities
   public productCode:             ImpProduct;                /// Product codes table with product specific infomation
   public projectId:               ImpProject;                /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpProductAllocation | {} = {}) {
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
         ['isActive',                 'number'],
         ['smAnneCpm',                'number'],
         ['buySeq',                   'number'],
         ['atzCharge',                'number'],
         ['emailIncludeAtz',          'number'],
         ['wrapIncludeNonWeekly',     'number'],
         ['customerNumber',           'string'],
         ['smIncludeVdp',             'number'],
         ['isRunAvail',               'number'],
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
         ['entryPointCode',           'EntryPoint'],
         ['finishedSize',             'PricingFinishedSize'],
         ['sfdcProductCode',          'SfdcProduct'],
         ['vdpTypeCode',              'VdpType'],
         ['wrapPagePriorityCode',     'WrapPagePriority'],
         ['productCode',              'ImpProduct'],
         ['projectId',                'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}