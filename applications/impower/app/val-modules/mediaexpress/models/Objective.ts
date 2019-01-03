/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_OBJECTIVES
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class Objective
{
   public objectiveCode:  string;              /// Objective Cd
   public createUser:     number;              /// Fk Create User
   public createDate:     Date;                /// Create Date
   public modifyUser:     number;              /// Fk Modify User
   public modifyDate:     Date;                /// Modify Date
   public objective:      string;              /// Objective
   public description:    string;              /// Description
   public sortOrder:      number;              /// Sort Order
   public isActive:       number;              /// Is Active

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<Objective>) {
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
         ['objectiveCode',   'string'],
         ['createUser',      'number'],
         ['createDate',      'Date'],
         ['modifyUser',      'number'],
         ['modifyDate',      'Date'],
         ['objective',       'string'],
         ['description',     'string'],
         ['sortOrder',       'number'],
         ['isActive',        'number']
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
