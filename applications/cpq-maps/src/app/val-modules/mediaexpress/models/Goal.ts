/** A MEDIAPLANNING domain class representing the table: CBX.CBX_GOALS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';

export class Goal extends BaseModel
{
   public goalCode:         string;         /// Goal Cd
   public goal:             string;         /// Goal
   public goalDescription:  string;         /// Description
   public sortOrder:        number;         /// Sort Order
   public isActiveGoal:     boolean;        /// Is Active

   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getAdvertiserInfos(): ReadonlyArray<AdvertiserInfo> {
      let _result: Array<AdvertiserInfo> = new Array<AdvertiserInfo>();
      return _result;
   }

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<Goal>) {
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
         ['goalCode',        'string'],
         ['createUser',      'number'],
         ['createDate',      'Date'],
         ['modifyUser',      'number'],
         ['modifyDate',      'Date'],
         ['goal',            'string'],
         ['description',     'string'],
         ['sortOrder',       'number'],
         ['isActive',        'boolean']
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

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['advertiserInfo',  'Array<AdvertiserInfo>'],
         ['mpInputsTmp',     'Array<MpInputsTmp>'],
         ['productDefault',  'Array<ProductDefault>'],
         ['impProject',      'Array<ImpProject>'],
      ]);
   }
}
