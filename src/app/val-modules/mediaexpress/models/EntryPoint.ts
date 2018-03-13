/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_ENTRY_POINTS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class EntryPoint
{
   public entryPointCode:       string;                    /// Entry Point Cd
   public createUser:           number;                    /// Fk Create User
   public createDate:           Date;                      /// Create Date
   public modifyUser:           number;                    /// Fk Modify User
   public modifyDate:           Date;                      /// Modify Date
   public entryPoint:           string;                    /// Entry Point
   public isDefault:            number;                    /// Is Default
   public sortOrder:            number;                    /// Sort Order

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<EntryPoint>) {
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
         ['entryPointCode',        'string'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['entryPoint',            'string'],
         ['isDefault',             'number'],
         ['sortOrder',             'number']
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