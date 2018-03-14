/** A TARGETING domain class representing the table: IMPOWER.IMP_RAD_LOOKUP
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpRadLookup
{
   public radId:        number;
   public category:     string;
   public product:      string;
   public source:       number;
   public responseRate: number;
   public noOfCoupon:   number;
   public avgTicket:    number;
   public estCpm:       number;
   public grossMargin:  number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpRadLookup>) {
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
         ['radId',         'number'],
         ['category',      'string'],
         ['product',       'string'],
         ['source',        'number'],
         ['responseRate',  'number'],
         ['noOfCoupon',    'number'],
         ['avgTicket',     'number'],
         ['estCpm',        'number'],
         ['grossMargin',   'number']
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