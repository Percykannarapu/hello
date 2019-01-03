/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_WRAP_PAGE_PRIORITY
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class WrapPagePriority
{
   public wrapPagePriorityCode:      string;                    /// Wrap Page Priority Cd
   public createUser:                number;                    /// Fk Create User
   public createDate:                Date;                      /// Create Date
   public modifyUser:                number;                    /// Fk Modify User
   public modifyDate:                Date;                      /// Modify Date
   public wrapPagePriority:          string;                    /// Wrap Page Priority
   public sortOrder:                 number;                    /// Sort Order
   public isActive:                  number;                    /// Is Active
   public isMatchingPreferredDate:   number;                    /// Is Matching Preferred Date
   public isPagePosition:            number;                    /// Is Page Position
   public isDefault:                 number;                    /// Is Default

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<WrapPagePriority>) {
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
         ['wrapPagePriorityCode',       'string'],
         ['createUser',                 'number'],
         ['createDate',                 'Date'],
         ['modifyUser',                 'number'],
         ['modifyDate',                 'Date'],
         ['wrapPagePriority',           'string'],
         ['sortOrder',                  'number'],
         ['isActive',                   'number'],
         ['isMatchingPreferredDate',    'number'],
         ['isPagePosition',             'number'],
         ['isDefault',                  'number']
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
