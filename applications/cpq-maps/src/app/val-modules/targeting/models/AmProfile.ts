/** A TARGETING domain class representing the table: SDE.AM_PROFILES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { AmSite } from './AmSite';

export class AmProfile extends BaseModel
{
   public pk:                number;         /// Pk
   public createUser:        number;         /// Fk Create User
   public group:             number;         /// Fk Group
   public createDate:        Date;           /// Create Date
   public name:              string;         /// Name
   public description:       string;         /// Description
   public clientId:          string;         /// Client Id
   public methAccess:        number;         /// Meth Access
   public methAnalysis:      string;         /// Meth Analysis
   public methDistribution:  string;         /// Meth Distribution
   public methSeason:        string;         /// Meth Season
   public taSource:          number;         /// Ta Source
   public xmlVariable:       string;         /// Xml Variables
   public xmlTradearea:      string;         /// Xml Tradearea
   public xmlSicquery:       string;         /// Xml Sicquery
   public modifyUser:        number;         /// Fk Modify User
   public modifyDate:        Date;           /// Modify Date

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public sites:                  Array<AmSite> = new Array<AmSite>();
   // ----------------------------------------------------------------------------

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<AmProfile>) {
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
      this.sites.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.sites.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.sites = (this.sites||[]).map(ma => new AmSite(ma));

      // Push this as transient parent to children
      this.sites.forEach(fe => fe.amProfile = this);

      // Ask the children to convert into models
      this.sites.forEach(fe => fe.convertToModel());

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
         ['group',             'number'],
         ['createDate',        'Date'],
         ['name',              'string'],
         ['description',       'string'],
         ['clientId',          'string'],
         ['methAccess',        'number'],
         ['methAnalysis',      'string'],
         ['methDistribution',  'string'],
         ['methSeason',        'string'],
         ['taSource',          'number'],
         ['xmlVariable',       'string'],
         ['xmlTradearea',      'string'],
         ['xmlSicquery',       'string'],
         ['modifyDate',        'Date']
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
         ['amUser',            'AmUser'],
         ['amUser',            'AmUser'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['amUser',            'AmUser'],
         ['amUser',            'AmUser'],

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['advertiserInfo',    'Array<AdvertiserInfo>'],
         ['mediaPlan',         'Array<MediaPlan>'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}