/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_CLIENT_IDENTIFIER_TYPES */
export class ClientIdentifierType
{
   public clientIdentifierTypeCode: string;                   /// Clientidentifiertypecd
   public createUser:               number;                   /// Fkcreateuser
   public createDate:               Date;                     /// Createdate
   public modifyUser:               number;                   /// Fkmodifyuser
   public modifyDate:               Date;                     /// Modifydate
   public clientIdentifierType:     string;                   /// Clientidentifiertype
   public description:              string;                   /// Description
   public sortOrder:                number;                   /// Sortorder
   public isActive:                 number;                   /// Isactive

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ClientIdentifierType | {} = {}) {
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
         ['clientIdentifierTypeCode', 'string'],
         ['createUser',               'number'],
         ['createDate',               'Date'],
         ['modifyUser',               'number'],
         ['modifyDate',               'Date'],
         ['clientIdentifierType',     'string'],
         ['description',              'string'],
         ['sortOrder',                'number'],
         ['isActive',                 'number']
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