/** A TARGETING domain class representing the table: IMPOWER.IMP_IFACE03_ZIP_LEVEL_COUNTS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpIface03ZipLevelCount
{
   public zipCode:            string;
   public baseCount:          number;
   public businessCount:      number;
   public soloCount:          number;
   public validFromDate:      Date;
   public validToDate:        Date;
   public isOnlyWayToGetMail: number;
   public isPobOnly:          number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpIface03ZipLevelCount>) {
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
         ['zipCode',             'string'],
         ['baseCount',           'number'],
         ['businessCount',       'number'],
         ['soloCount',           'number'],
         ['validFromDate',       'Date'],
         ['validToDate',         'Date'],
         ['isOnlyWayToGetMail',  'number'],
         ['isPobOnly',           'number']
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
