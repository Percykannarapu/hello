/** A TARGETING domain class representing the table: SDE.AM_SITES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { AmProfile } from './AmProfile';

export class AmSite extends BaseModel
{
   public pk:            number;         /// Pk
   public profile:       number;         /// Fk Profile
   public xcoord:        number;         /// Xcoord
   public ycoord:        number;         /// Ycoord
   public siteType:      number;         /// Site Type
   public legacySiteId:  string;         /// Site Id
   public name:          string;         /// Name
   public owner:         string;         /// Owner
   public franchisee:    string;         /// Franchisee
   public address:       string;         /// Address
   public crossStreet:   string;         /// Cross Street
   public city:          string;         /// City
   public state:         string;         /// State
   public zip:           string;         /// Zip
   public taSource:      number;         /// Ta Source
   public xmlLocation:   string;         /// Xml Location
   public xmlTradearea:  string;         /// Xml Tradearea
   public createType:    number;         /// Create Type
   public grouping:      string;         /// Grouping

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public amProfile:        AmProfile;             /// Crossbow Targeting profile


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<AmSite>) {
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
         ['pk',                'number'],
         ['xcoord',            'number'],
         ['ycoord',            'number'],
         ['siteType',          'number'],
         ['siteId',            'string'],
         ['name',              'string'],
         ['owner',             'string'],
         ['franchisee',        'string'],
         ['address',           'string'],
         ['crossStreet',       'string'],
         ['city',              'string'],
         ['state',             'string'],
         ['zip',               'string'],
         ['taSource',          'number'],
         ['xmlLocation',       'string'],
         ['xmlTradearea',      'string'],
         ['createType',        'number'],
         ['grouping',          'string']
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
         ['amProfile',         'AmProfile'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['amProfile',         'AmProfile'],
      ]);
   }
}
