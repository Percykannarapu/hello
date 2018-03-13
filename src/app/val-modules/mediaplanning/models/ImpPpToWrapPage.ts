/** A MEDIAPLANNING domain class representing the table: IMPOWER.IMP_PP_TO_WRAP_PAGES
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { SfdcProduct } from '../../mediaexpress/models/SfdcProduct';
import { WrapPagePosition } from '../../mediaexpress/models/WrapPagePosition';
import { ImpProductAllocation } from './ImpProductAllocation';

export class ImpPpToWrapPage
{
   public pptwpId:                  number;                    /// Pptwp Id
   public createUser:               number;                    /// Fk Create User
   public createDate:               Date;                      /// Create Date
   public modifyUser:               number;                    /// Fk Modify User
   public modifyDate:               Date;                      /// Modify Date
   public priority:                 number;                    /// Priority
   public rateOverride:             number;                    /// Rate Override
   public anneRateOverride:         number;                    /// Anne Rate Override

   // IMPOWER.IMP_PP_TO_WRAP_PAGES - MANY TO ONE RELATIONSHIP MEMBERS
   // ---------------------------------------------------------------
   public sfdcProduct:              SfdcProduct;              
   public wrapPagePosition:         WrapPagePosition;          /// WRAP Page Positions
   public impProductAllocation:     ImpProductAllocation;      /// Product allocations for an Advertiser_Info_Id

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpPpToWrapPage>) {
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
         ['pptwpId',                   'number'],
         ['createUser',                'number'],
         ['createDate',                'Date'],
         ['modifyUser',                'number'],
         ['modifyDate',                'Date'],
         ['priority',                  'number'],
         ['rateOverride',              'number'],
         ['anneRateOverride',          'number']
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
         ['sfdcProduct',               'SfdcProduct'],
         ['wrapPagePosition',          'WrapPagePosition'],
         ['impProductAllocation',      'ImpProductAllocation']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}