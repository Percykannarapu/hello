/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_PRICING_FINISHED_SIZES_MV
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

export class PricingFinishedSize
{
   public finishedSize:         string;                    /// Finished Size

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: PricingFinishedSize | {} = {}) {
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
         ['finishedSize',          'string']
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