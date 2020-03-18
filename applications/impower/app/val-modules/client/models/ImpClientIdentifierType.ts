/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_IDENTIFIER_TYPES
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpClientIdentifierType
{
   public clientIdentifierTypeCode: string;     /// Client Identifier Type Cd
   public createUser:               number;     /// Fk Create User
   public createDate:               number;       /// Create Date
   public modifyUser:               number;     /// Fk Modify User
   public modifyDate:               number;       /// Modify Date
   public clientIdentifierType:     string;     /// Client Identifier Type
   public description:              string;     /// Description
   public sortOrder:                number;     /// Sort Order
   public isActive:                 number;     /// Is Active

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClientIdentifierType>) {
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
         ['clientIdentifierTypeCode',  'string'],
         ['createUser',                'number'],
         ['createDate',                'number'],
         ['modifyUser',                'number'],
         ['modifyDate',                'number'],
         ['clientIdentifierType',      'string'],
         ['description',               'string'],
         ['sortOrder',                 'number'],
         ['isActive',                  'number']
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
