/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_PP_TO_WRAP_PAGES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ProductAllocation } from './ProductAllocation';

export class PpToWrapPage extends BaseModel
{
   public pptwpId:               number;         /// Pptwp Id
   public createUser:            number;         /// Fk Create User
   public createDate:            Date;           /// Create Date
   public modifyUser:            number;         /// Fk Modify User
   public modifyDate:            Date;           /// Modify Date
   public productAllocationId:   number;         /// Fk Product Allocation Id
   public wrapPagePositionCode:  string;         /// Fk Wrap Page Position Cd
   public priority:              number;         /// Priority
   public rateOverride:          number;         /// Rate Override
   public anneRateOverride:      number;         /// Anne Rate Override
   public sfdcProductCode:       string;
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public productAllocation:       ProductAllocation;          /// Product allocations for an Advertiser_Info_Id

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<PpToWrapPage>) {
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
         ['pptwpId',                  'number'],
         ['createUser',               'number'],
         ['createDate',               'Date'],
         ['modifyUser',               'number'],
         ['modifyDate',               'Date'],
         ['priority',                 'number'],
         ['rateOverride',             'number'],
         ['anneRateOverride',         'number']
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
         ['productAllocation',        'ProductAllocation'],
         ['sfdcProduct',              'SfdcProduct'],
         ['wrapPagePosition',         'WrapPagePosition'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['productAllocation',        'ProductAllocation'],
         ['sfdcProduct',              'SfdcProduct'],
         ['wrapPagePosition',         'WrapPagePosition'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}