/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_SITE_ATTRIBS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

export class ImpGeofootprintSiteAttrib
{
   public siteAttributeId: number;     /// Primary Key
   public createUser:      number;
   public createDate:      Date;
   public modifyUser:      number;
   public modifyDate:      Date;
   public gsId:            number;
   public attributeCode:   string;
   public attributeType:   string;
   public attributeValue:  string;
   public formatMask:      string;
   public isActive:        number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintSiteAttrib | {} = {}) {
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
         ['siteAttributeId',  'number'],
         ['createUser',       'number'],
         ['createDate',       'Date'],
         ['modifyUser',       'number'],
         ['modifyDate',       'Date'],
         ['gsId',             'number'],
         ['attributeCode',    'string'],
         ['attributeType',    'string'],
         ['attributeValue',   'string'],
         ['formatMask',       'string'],
         ['isActive',         'number']
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
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}