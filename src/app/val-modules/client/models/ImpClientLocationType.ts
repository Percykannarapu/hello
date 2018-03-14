/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_LOCATION_TYPES
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpClientLocationType
{
   public clientLocationTypeCode:    string;                       /// Primary Key
   public createUser:                number;                       /// User to create the row
   public createDate:                Date;
   public modifyUser:                number;
   public modifyDate:                Date;
   public clientLocationType:        string;                       /// ex. CLIENT or COMPETITOR
   public sortOrder:                 number;
   public isDefault:                 number;
   public isActive:                  number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClientLocationType>) {
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
         ['clientLocationTypeCode',     'string'],
         ['createUser',                 'number'],
         ['createDate',                 'Date'],
         ['modifyUser',                 'number'],
         ['modifyDate',                 'Date'],
         ['clientLocationType',         'string'],
         ['sortOrder',                  'number'],
         ['isDefault',                  'number'],
         ['isActive',                   'number']
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