/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_SITE_TYPES
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

export class ImpClientSiteType
{
   public clientSiteTypeCode: string;                 /// Primary Key
   public createUser:         number;                 /// User to create the row
   public createDate:         Date;
   public modifyUser:         number;
   public modifyDate:         Date;
   public clientSiteType:     string;                 /// ex. CLIENT or COMPETITOR
   public sortOrder:          number;
   public isDefault:          number;
   public isActive:           number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpClientSiteType | {} = {}) {
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
         ['clientSiteTypeCode',  'string'],
         ['createUser',          'number'],
         ['createDate',          'Date'],
         ['modifyUser',          'number'],
         ['modifyDate',          'Date'],
         ['clientSiteType',      'string'],
         ['sortOrder',           'number'],
         ['isDefault',           'number'],
         ['isActive',            'number']
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